import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { adminAppOrigins } from "@/lib/env";

export const STAFF_INVITE_TTL_HOURS = 72;

/** The admin console's address, used in invitation links. Null when ADMIN_APP_URL isn't set. */
export function adminAppUrl(): string | null {
  return adminAppOrigins[0] ?? null;
}

/**
 * A one-time link to the admin console's set-password page. It is a
 * better-auth password-reset token with a longer expiry; better-auth's
 * /reset-password creates the password login when the account has none.
 */
export async function createPasswordSetupLink(userId: string): Promise<string | null> {
  const base = adminAppUrl();
  if (!base) return null;
  const token = randomBytes(24).toString("base64url");
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({
    identifier: `reset-password:${token}`,
    value: userId,
    expiresAt: new Date(Date.now() + STAFF_INVITE_TTL_HOURS * 60 * 60 * 1000),
  });
  return `${base}/set-password?token=${token}`;
}

/** Which of these users can sign in with a password. */
export async function usersWithPassword(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(inArray(accounts.userId, userIds), eq(accounts.providerId, "credential")));
  return new Set(rows.map((r) => r.userId));
}
