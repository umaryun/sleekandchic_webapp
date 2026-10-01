import { and, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, cartItems, products, productImages, productVariants } from "@/lib/db/schema";
import { koboToNaira, toKobo } from "@/lib/money";

export const MAX_LINE_QUANTITY = 20;

export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface CartLine {
  itemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  /** Current price from the catalogue, not the price when the item was added. */
  unitPriceKobo: number;
  /** Null when stock isn't tracked (a product with no variants). */
  stockAvailable: number | null;
  /** Why this line can't be bought right now, if it can't. */
  problem: string | null;
}

/** Finds the signed-in user's cart, or the guest cart for the token. */
export async function findCart(userId: string | null, guestToken: string | null, tx: DbOrTx = db) {
  if (userId) {
    const [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return cart ?? null;
  }
  if (guestToken) {
    const [cart] = await tx.select().from(carts).where(eq(carts.guestSessionToken, guestToken)).limit(1);
    return cart ?? null;
  }
  return null;
}

/**
 * Loads a cart's lines priced from the catalogue. With `lockVariants`, the
 * variant rows are locked (SELECT … FOR UPDATE) so stock can be taken safely
 * inside the caller's transaction.
 */
export async function loadCartLines(
  cartId: string,
  tx: DbOrTx = db,
  { lockVariants = false }: { lockVariants?: boolean } = {}
): Promise<CartLine[]> {
  const items = await tx
    .select({
      itemId: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      productName: products.name,
      productSlug: products.slug,
      productPrice: products.price,
      productInStock: products.inStock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.id));

  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantQuery = tx
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .orderBy(asc(productVariants.id));
  const variants = lockVariants ? await variantQuery.for("update") : await variantQuery;

  const variantById = new Map(variants.map((v) => [v.id, v]));
  // Archived variants still resolve (so the line can say what was removed) but
  // don't make a product count as having sizes to choose from.
  const productsWithVariants = new Set(variants.filter((v) => v.isActive).map((v) => v.productId));

  return items.map((item) => {
    const variant = item.variantId ? variantById.get(item.variantId) : undefined;
    let problem: string | null = null;
    let stockAvailable: number | null = null;

    if (!item.productInStock) {
      problem = `${item.productName} is no longer available`;
    } else if (variant && !variant.isActive) {
      problem = `${item.productName} (${describeVariant(variant)}) is no longer available`;
    } else if (productsWithVariants.has(item.productId)) {
      if (!variant || variant.productId !== item.productId) {
        problem = `Choose a size and colour for ${item.productName}`;
      } else {
        stockAvailable = variant.stockQuantity;
        if (variant.stockQuantity < item.quantity) {
          problem =
            variant.stockQuantity === 0
              ? `${item.productName} (${describeVariant(variant)}) is sold out`
              : `Only ${variant.stockQuantity} left of ${item.productName} (${describeVariant(variant)})`;
        }
      }
    }

    const priceSource = variant?.priceOverride ?? item.productPrice;
    return {
      itemId: item.itemId,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      variantId: variant ? variant.id : null,
      size: variant?.size ?? null,
      color: variant?.color ?? null,
      quantity: item.quantity,
      unitPriceKobo: toKobo(priceSource),
      stockAvailable,
      problem,
    };
  });
}

export function describeVariant(v: { size: string | null; color: string | null }) {
  return [v.color, v.size].filter(Boolean).join(", ") || "default";
}

/** First image per product, in display order. */
export async function firstImages(productIds: string[], tx: DbOrTx = db) {
  if (productIds.length === 0) return new Map<string, string>();
  const rows = await tx
    .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.displayOrder));
  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.productId)) map.set(row.productId, row.imageUrl);
  return map;
}

/** The cart as the storefront shows it, priced from the current catalogue. */
export async function cartPayload(cartId: string, guestToken: string | null) {
  const lines = await loadCartLines(cartId);
  const images = await firstImages([...new Set(lines.map((l) => l.productId))]);
  const items = lines.map((line) => ({
    id: line.itemId,
    productId: line.productId,
    productName: line.productName,
    productSlug: line.productSlug,
    productInStock: line.problem === null,
    image: images.get(line.productId) ?? null,
    variantId: line.variantId,
    size: line.size,
    color: line.color,
    quantity: line.quantity,
    unitPrice: koboToNaira(line.unitPriceKobo),
    total: koboToNaira(line.unitPriceKobo * line.quantity),
    stockAvailable: line.stockAvailable,
    problem: line.problem,
  }));
  const subtotal = koboToNaira(lines.reduce((sum, l) => sum + l.unitPriceKobo * l.quantity, 0));
  return { items, subtotal, guestToken };
}

/**
 * Moves a guest's bag into the signed-in customer's bag. With no bag of their
 * own, the guest cart simply becomes theirs (keeping its id, which pending
 * orders refer to). Otherwise lines are added in, same lines' quantities
 * combined up to the per-line limit, and the guest cart is removed.
 * Returns the customer's cart id, or null if they have no cart at all.
 */
export async function mergeGuestCart(userId: string, guestToken: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [guest] = await tx
      .select()
      .from(carts)
      .where(eq(carts.guestSessionToken, guestToken))
      .for("update")
      .limit(1);
    const [own] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);

    if (!guest) return own?.id ?? null;

    if (!own) {
      await tx
        .update(carts)
        .set({ userId, guestSessionToken: null, updatedAt: new Date() })
        .where(eq(carts.id, guest.id));
      return guest.id;
    }

    const guestLines = await tx.select().from(cartItems).where(eq(cartItems.cartId, guest.id));
    const ownLines = await tx.select().from(cartItems).where(eq(cartItems.cartId, own.id));
    const key = (l: { productId: string; variantId: string | null }) => `${l.productId}:${l.variantId ?? ""}`;
    const ownByKey = new Map(ownLines.map((l) => [key(l), l]));

    for (const line of guestLines) {
      const match = ownByKey.get(key(line));
      if (match) {
        await tx
          .update(cartItems)
          .set({ quantity: Math.min(match.quantity + line.quantity, MAX_LINE_QUANTITY) })
          .where(and(eq(cartItems.id, match.id), eq(cartItems.cartId, own.id)));
      } else {
        await tx.update(cartItems).set({ cartId: own.id }).where(eq(cartItems.id, line.id));
      }
    }

    await tx.delete(carts).where(eq(carts.id, guest.id));
    await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, own.id));
    return own.id;
  });
}
