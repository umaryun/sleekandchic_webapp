import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development (no Redis required)
const cache = new Map<string, { count: number; reset: number }>();

function createInMemoryRateLimiter(maxRequests: number, windowMs: number) {
  return {
    async limit(key: string) {
      const now = Date.now();
      const entry = cache.get(key);

      if (!entry || now > entry.reset) {
        cache.set(key, { count: 1, reset: now + windowMs });
        return { success: true, remaining: maxRequests - 1 };
      }

      if (entry.count >= maxRequests) {
        return { success: false, remaining: 0 };
      }

      entry.count++;
      return { success: true, remaining: maxRequests - entry.count };
    },
  };
}

// Redis-based rate limiter (production)
function createRedisRateLimiter(maxRequests: number, windowMs: number) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    analytics: true,
  });
}

// Public routes: 100 req/min
export const publicRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? createRedisRateLimiter(100, 60_000)
  : createInMemoryRateLimiter(100, 60_000);

// Admin routes: 300 req/min
export const adminRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? createRedisRateLimiter(300, 60_000)
  : createInMemoryRateLimiter(300, 60_000);
