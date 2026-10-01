import dotenv from "dotenv";
import { z } from "zod";

// Next.js loads .env files itself; standalone scripts (seed, storage setup) run
// under tsx and need them loaded here, before anything reads process.env.
if (!process.env.NEXT_RUNTIME) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const isProduction = process.env.NODE_ENV === "production";

// Unset and empty ("KEY=") are treated the same.
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

const schema = z.object({
  DATABASE_URL: z.string().min(1, "is required"),
  // Public URL of the storefront. Used for auth callbacks and payment redirects.
  BETTER_AUTH_URL: isProduction ? z.url() : z.url().default("http://localhost:3000"),
  // Comma-separated origins allowed to call the admin API.
  ADMIN_APP_URL: optional,
  PAYSTACK_SECRET_KEY: optional,
  SUPABASE_URL: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,
  // Email (Resend). Without both, emails are logged instead of sent.
  RESEND_API_KEY: optional,
  // A sender on a domain verified in Resend, e.g. "Sleekandchic <orders@sleekandchic.com>".
  EMAIL_FROM: optional,
  // Who receives new-order alerts; defaults to the store's contact email.
  OWNER_NOTIFICATION_EMAIL: optional,
  // Optional Upstash Redis for request limits. Without it, limits are counted
  // in Postgres.
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  // `next build` imports route modules without runtime secrets; the check runs
  // again when the server starts.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return process.env as unknown as Env;
  }

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment variables:\n${problems}`);
}

/** Validated server configuration. Read settings from here, not process.env. */
export const env = loadEnv();

/**
 * The storefront's public address, for absolute links (sitemap, share
 * previews). Required in production; during `next build` it may be unset.
 */
export const siteUrl = (env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Origins of the admin console; localhost:3001 is assumed only in development. */
export const adminAppOrigins = (env.ADMIN_APP_URL ?? (isProduction ? "" : "http://localhost:3001"))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
