import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { toKobo } from "@/lib/money";
import type { DbOrTx } from "@/lib/services/cart";

export type DiscountRecord = typeof discounts.$inferSelect;

export type DiscountResult =
  | { ok: true; discount: DiscountRecord; amountKobo: number }
  | { ok: false; error: string };

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

/** Checks a promo code against a subtotal. Does not use up the code. */
export async function evaluateDiscount(
  rawCode: string,
  subtotalKobo: number,
  tx: DbOrTx = db
): Promise<DiscountResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a promo code" };

  const [discount] = await tx
    .select()
    .from(discounts)
    .where(and(eq(discounts.code, code), eq(discounts.isActive, true)))
    .limit(1);

  if (!discount) return { ok: false, error: `The code ${code} isn't valid` };

  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) {
    return { ok: false, error: `The code ${code} isn't active yet` };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return { ok: false, error: `The code ${code} has expired` };
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { ok: false, error: `The code ${code} has been fully used` };
  }
  const minKobo = discount.minOrderAmount ? toKobo(discount.minOrderAmount) : 0;
  if (subtotalKobo < minKobo) {
    return {
      ok: false,
      error: `The code ${code} needs an order of at least ₦${(minKobo / 100).toLocaleString("en-NG")}`,
    };
  }

  const value = Number(discount.value);
  const raw =
    discount.discountType === "percentage"
      ? Math.round((subtotalKobo * Math.min(value, 100)) / 100)
      : toKobo(value);

  return { ok: true, discount, amountKobo: Math.min(raw, subtotalKobo) };
}

/**
 * Uses up one redemption. The conditional update keeps concurrent checkouts
 * from going past maxUses. Returns false when the code ran out meanwhile.
 */
export async function claimDiscount(tx: DbOrTx, discountId: string): Promise<boolean> {
  const claimed = await tx
    .update(discounts)
    .set({ usedCount: sql`${discounts.usedCount} + 1` })
    .where(
      and(
        eq(discounts.id, discountId),
        sql`(${discounts.maxUses} IS NULL OR ${discounts.usedCount} < ${discounts.maxUses})`
      )
    )
    .returning({ id: discounts.id });
  return claimed.length > 0;
}

/** Gives back a redemption when its order is cancelled or expires unpaid. */
export async function releaseDiscount(tx: DbOrTx, code: string) {
  await tx
    .update(discounts)
    .set({ usedCount: sql`GREATEST(${discounts.usedCount} - 1, 0)` })
    .where(eq(discounts.code, normalizeCode(code)));
}
