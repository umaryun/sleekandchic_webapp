import { and, eq, inArray } from "drizzle-orm";
import { cartItems, orderItems, productVariants, stockMovements } from "@/lib/db/schema";
import { koboToDecimal, toKobo } from "@/lib/money";
import type { DbOrTx } from "@/lib/services/cart";

export interface VariantInput {
  id?: string | null;
  size?: string | null;
  color?: string | null;
  stockQuantity: number;
  priceOverride?: number | null;
}

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
const comboKey = (v: { size?: string | null; color?: string | null }) => `${norm(v.size)}|${norm(v.color)}`;

/** Size/colour combinations that appear more than once, for a clear error. */
export function duplicateCombos(variants: VariantInput[]) {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const v of variants) {
    const key = comboKey(v);
    if (seen.has(key)) dupes.push([v.color, v.size].filter(Boolean).join(" / ") || "no size or colour");
    seen.add(key);
  }
  return dupes;
}

/**
 * Brings a product's variants in line with the editor's list without
 * replacing them: each incoming row updates the variant with its id (or the
 * same size and colour), new rows are added, and rows that were removed are
 * deleted only when nothing refers to them; otherwise they're archived so
 * orders, bags and stock history keep pointing at a real variant. Stock
 * changes are recorded as adjustments.
 */
export async function syncVariants(tx: DbOrTx, productId: string, incoming: VariantInput[], actorId: string | null) {
  const existing = await tx.select().from(productVariants).where(eq(productVariants.productId, productId));
  const byId = new Map(existing.map((v) => [v.id, v]));
  const byCombo = new Map(existing.map((v) => [comboKey(v), v]));
  const kept = new Set<string>();
  const movements: (typeof stockMovements.$inferInsert)[] = [];

  for (const v of incoming) {
    const match = (v.id && byId.get(v.id)) || byCombo.get(comboKey(v));
    const fields = {
      size: v.size?.trim() || null,
      color: v.color?.trim() || null,
      priceOverride: v.priceOverride ? koboToDecimal(toKobo(v.priceOverride)) : null,
      isActive: true,
    };
    if (match && !kept.has(match.id)) {
      kept.add(match.id);
      const delta = v.stockQuantity - match.stockQuantity;
      await tx
        .update(productVariants)
        .set({ ...fields, stockQuantity: v.stockQuantity })
        .where(eq(productVariants.id, match.id));
      if (delta !== 0) {
        movements.push({ variantId: match.id, productId, delta, reason: "adjustment", actorId, note: "Edited on the product page" });
      }
    } else {
      const [created] = await tx
        .insert(productVariants)
        .values({ ...fields, productId, stockQuantity: v.stockQuantity })
        .returning({ id: productVariants.id });
      kept.add(created.id);
      if (v.stockQuantity > 0) {
        movements.push({ variantId: created.id, productId, delta: v.stockQuantity, reason: "adjustment", actorId, note: "Opening stock" });
      }
    }
  }

  const removed = existing.filter((v) => !kept.has(v.id));
  if (removed.length > 0) {
    const ids = removed.map((v) => v.id);
    const [inOrders, inCarts, inHistory] = await Promise.all([
      tx.selectDistinct({ id: orderItems.variantId }).from(orderItems).where(inArray(orderItems.variantId, ids)),
      tx.selectDistinct({ id: cartItems.variantId }).from(cartItems).where(inArray(cartItems.variantId, ids)),
      tx.selectDistinct({ id: stockMovements.variantId }).from(stockMovements).where(inArray(stockMovements.variantId, ids)),
    ]);
    const referenced = new Set([...inOrders, ...inCarts, ...inHistory].map((r) => r.id));
    const archive = ids.filter((id) => referenced.has(id));
    const remove = ids.filter((id) => !referenced.has(id));
    if (archive.length > 0) {
      await tx.update(productVariants).set({ isActive: false }).where(inArray(productVariants.id, archive));
    }
    if (remove.length > 0) {
      await tx.delete(productVariants).where(inArray(productVariants.id, remove));
    }
  }

  if (movements.length > 0) await tx.insert(stockMovements).values(movements);
}

/** Active variants only, for anything shoppers or editors see. */
export const activeVariantsOf = (productId: string) =>
  and(eq(productVariants.productId, productId), eq(productVariants.isActive, true));
