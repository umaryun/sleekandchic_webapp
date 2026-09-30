import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, cartItems, products, productVariants } from "@/lib/db/schema";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";
import { describeVariant, findCart, firstImages, loadCartLines } from "@/lib/services/cart";
import { koboToNaira } from "@/lib/money";

const MAX_LINE_QUANTITY = 20;

async function findOrCreateCart(userId: string | null, guestToken: string | null) {
  const existing = await findCart(userId, guestToken);
  if (existing) return existing;
  const [created] = await db
    .insert(carts)
    .values(userId ? { userId } : { guestSessionToken: guestToken ?? crypto.randomUUID() })
    .returning();
  return created;
}

/** The cart as the storefront shows it, priced from the current catalogue. */
async function cartResponse(cartId: string, guestToken: string | null) {
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
  return apiSuccess({ items, subtotal, guestToken });
}

// ──────────────────────────────────────────────
// GET — Retrieve cart
// ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guestToken = req.headers.get("x-guest-token");
    const userId = session?.user?.id || null;

    const cart = await findCart(userId, guestToken);
    if (!cart) {
      return apiSuccess({ items: [], subtotal: 0, guestToken: userId ? null : guestToken });
    }
    return cartResponse(cart.id, cart.guestSessionToken ?? null);
  } catch (err) {
    console.error("GET /api/v1/store/cart error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// POST — Add / Update / Remove cart items
// ──────────────────────────────────────────────

const cartActionSchema = z.object({
  action: z.enum(["add", "update", "remove"]),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, cartActionSchema);
    if (error) return error;
    const { action, productId, variantId, quantity } = data!;

    const session = await getSession(req);
    const guestToken = req.headers.get("x-guest-token");
    const userId = session?.user?.id || null;
    const cart = await findOrCreateCart(userId, guestToken);

    const sameLine = and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, productId),
      variantId ? eq(cartItems.variantId, variantId) : isNull(cartItems.variantId)
    );
    const [existing] = await db.select().from(cartItems).where(sameLine).limit(1);

    if (action === "remove" || (action === "update" && quantity === 0)) {
      if (existing) await db.delete(cartItems).where(eq(cartItems.id, existing.id));
      return cartResponse(cart.id, cart.guestSessionToken ?? null);
    }

    if (action === "update" && !existing) {
      return apiError("That item is no longer in your bag", 404);
    }

    const [product] = await db
      .select({ id: products.id, name: products.name, price: products.price, inStock: products.inStock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product) return apiError("This product is no longer available", 404);
    if (!product.inStock) return apiError(`${product.name} is currently unavailable`, 409);

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    let variant: (typeof variants)[number] | undefined;
    if (variants.length > 0) {
      variant = variants.find((v) => v.id === variantId);
      if (!variant) return apiError(`Choose a size and colour for ${product.name}`, 400);
    } else if (variantId) {
      return apiError("That option doesn't belong to this product", 400);
    }

    const newQuantity = action === "add" ? (existing?.quantity ?? 0) + Math.max(quantity, 1) : quantity;
    if (newQuantity > MAX_LINE_QUANTITY) {
      return apiError(`You can order up to ${MAX_LINE_QUANTITY} of one item`, 400);
    }
    if (variant && newQuantity > variant.stockQuantity) {
      const label = `${product.name} (${describeVariant(variant)})`;
      return apiError(
        variant.stockQuantity === 0
          ? `${label} is sold out`
          : `Only ${variant.stockQuantity} left of ${label}`,
        409
      );
    }

    // Kept for reference only; the cart and checkout always price from the catalogue.
    const unitPrice = variant?.priceOverride ?? product.price;

    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: newQuantity, unitPrice: String(unitPrice) })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        variantId: variant?.id ?? null,
        quantity: newQuantity,
        unitPrice: String(unitPrice),
      });
    }
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));

    return cartResponse(cart.id, cart.guestSessionToken ?? null);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/cart error:", err);
    return apiError("Internal server error", 500);
  }
}
