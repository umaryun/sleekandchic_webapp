import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { apiError } from "@/lib/api-utils";

/** Requests allowed per client IP in each window, by endpoint group. */
export const LIMITS = {
  // Placing an order and retrying a payment both reserve stock or open a Paystack session.
  checkout: { max: 10, windowSeconds: 10 * 60 },
  payment: { max: 10, windowSeconds: 10 * 60 },
  verify: { max: 30, windowSeconds: 60 },
  quote: { max: 60, windowSeconds: 60 },
  // Low, so order numbers and contact details can't be guessed in bulk.
  tracking: { max: 10, windowSeconds: 10 * 60 },
  contact: { max: 5, windowSeconds: 60 * 60 },
  cart: { max: 60, windowSeconds: 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

interface Outcome {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * The client's IP. Vercel and most proxies overwrite x-forwarded-for, so its
 * first entry is the client rather than something the client chose.
 */
export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

const upstash = new Map<LimitName, Ratelimit>();

function upstashLimiter(name: LimitName) {
  let limiter = upstash.get(name);
  if (!limiter) {
    const { max, windowSeconds } = LIMITS[name];
    limiter = new Ratelimit({
      redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL!, token: env.UPSTASH_REDIS_REST_TOKEN! }),
      limiter: Ratelimit.fixedWindow(max, `${windowSeconds} s`),
      prefix: `ratelimit:${name}`,
    });
    upstash.set(name, limiter);
  }
  return limiter;
}

async function consumeUpstash(name: LimitName, key: string): Promise<Outcome> {
  const { success, reset } = await upstashLimiter(name).limit(key);
  return { allowed: success, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}

/** One atomic upsert: starts a new window when the old one has ended. */
async function consumePostgres(name: LimitName, key: string): Promise<Outcome> {
  const { max, windowSeconds } = LIMITS[name];
  const [row] = await db
    .insert(rateLimits)
    .values({ key: `${name}:${key}`, count: 1, resetAt: sql`now() + ${`${windowSeconds} seconds`}::interval` })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // Occasionally clear out counters from windows that ended long ago.
  if (Math.random() < 0.01) {
    await db.delete(rateLimits).where(sql`${rateLimits.resetAt} < now() - interval '1 day'`);
  }

  return {
    allowed: row.count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
  };
}

/**
 * Counts this request against the client's limit. Returns a 429 response when
 * the limit is used up, or null to carry on. If the counter store is down, the
 * request is allowed rather than turning a storage outage into a shop outage.
 */
export async function rateLimit(req: Request, name: LimitName): Promise<Response | null> {
  const key = clientIp(req);
  let outcome: Outcome;
  try {
    outcome = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? await consumeUpstash(name, key)
      : await consumePostgres(name, key);
  } catch (err) {
    console.error(`Rate limit check failed (${name}); allowing the request:`, err);
    return null;
  }
  if (outcome.allowed) return null;

  const minutes = Math.ceil(outcome.retryAfterSeconds / 60);
  const response = apiError(
    `Too many attempts. Please wait ${minutes === 1 ? "a minute" : `${minutes} minutes`} and try again.`,
    429
  );
  response.headers.set("Retry-After", String(outcome.retryAfterSeconds));
  return response;
}
