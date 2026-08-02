import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { carts, cartItems, products, productImages, productVariants } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

async function findOrCreateCart(userId: string | null, guestToken: string | null) {
  if (userId) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    if (existing) return existing;
    const [created] = await db
      .insert(carts)
      .values({ userId })
      .returning();
    return created;
  }

  if (guestToken) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.guestSessionToken, guestToken))
      .limit(1);
    if (existing) return existing;
    const [created] = await db
      .insert(carts)
      .values({ guestSessionToken: guestToken })
      .returning();
    return created;
  }

  // Generate new guest token
  const token = crypto.randomUUID();
  const [created] = await db
    .insert(carts)
    .values({ guestSessionToken: token })
    .returning();
  return created;
}

async function getCartWithItems(cartId: string) {
  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      unitPrice: cartItems.unitPrice,
      productName: products.name,
      productSlug: products.slug,
      productInStock: products.inStock,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId!);

  const [images, variants] = await Promise.all([
    productIds.length > 0
      ? db
          .select({
            productId: productImages.productId,
            imageUrl: productImages.imageUrl,
          })
          .from(productImages)
          .where(sql`${productImages.productId} IN ${productIds}`)
          .orderBy(asc(productImages.displayOrder))
      : Promise.resolve([]),
    variantIds.length > 0
      ? db
          .select()
          .from(productVariants)
          .where(sql`${productVariants.id} IN ${variantIds}`)
      : Promise.resolve([]),
  ]);

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) {
      imageMap.set(img.productId, img.imageUrl);
    }
  }

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  return items.map((item) => {
    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      productInStock: item.productInStock,
      image: imageMap.get(item.productId) || null,
      variantId: item.variantId,
      size: variant?.size || null,
      color: variant?.color || null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.unitPrice) * item.quantity,
    };
  });
}

// ──────────────────────────────────────────────
// GET — Retrieve cart
// ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guestToken = req.headers.get("x-guest-token");

    const userId = session?.user?.id || null;
    if (!userId && !guestToken) {
      return apiSuccess({ items: [], subtotal: 0, guestToken: null });
    }

    // Find cart
    let cart;
    if (userId) {
      const [found] = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      cart = found;
    } else if (guestToken) {
      const [found] = await db
        .select()
        .from(carts)
        .where(eq(carts.guestSessionToken, guestToken))
        .limit(1);
      cart = found;
    }

    if (!cart) {
      return apiSuccess({ items: [], subtotal: 0, guestToken: guestToken || null });
    }

    const items = await getCartWithItems(cart.id);
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);

    return apiSuccess({
      items,
      subtotal,
      guestToken: cart.guestSessionToken || null,
    });
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
  quantity: z.number().int().min(0).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, cartActionSchema);
    if (error) return error;

    const session = await getSession(req);
    const guestToken = req.headers.get("x-guest-token");
    const userId = session?.user?.id || null;

    const cart = await findOrCreateCart(userId, guestToken);

    const { action, productId, variantId, quantity } = data!;

    if (action === "add") {
      // Check product exists
      const [product] = await db
        .select({ price: products.price, inStock: products.inStock })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) return apiError("Product not found", 404);
      if (!product.inStock) return apiError("Product out of stock", 400);

      // Check variant price override
      let unitPrice = Number(product.price);
      if (variantId) {
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, variantId))
          .limit(1);
        if (variant?.priceOverride) {
          unitPrice = Number(variant.priceOverride);
        }
      }

      // Check if item already in cart
      const conditions = [
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
      ];

      const existing = await db
        .select()
        .from(cartItems)
        .where(and(...conditions));

      const match = existing.find(
        (i) => (i.variantId || null) === (variantId || null)
      );

      if (match) {
        await db
          .update(cartItems)
          .set({ quantity: match.quantity + quantity })
          .where(eq(cartItems.id, match.id));
      } else {
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          unitPrice: String(unitPrice),
        });
      }
    } else if (action === "update") {
      if (quantity <= 0) {
        // Remove if quantity is 0
        await db
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.cartId, cart.id),
              eq(cartItems.productId, productId),
              variantId
                ? eq(cartItems.variantId, variantId)
                : sql`${cartItems.variantId} IS NULL`
            )
          );
      } else {
        const existing = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.cartId, cart.id),
              eq(cartItems.productId, productId)
            )
          );

        const match = existing.find(
          (i) => (i.variantId || null) === (variantId || null)
        );

        if (match) {
          await db
            .update(cartItems)
            .set({ quantity })
            .where(eq(cartItems.id, match.id));
        }
      }
    } else if (action === "remove") {
      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.productId, productId)
          )
        );

      const match = existing.find(
        (i) => (i.variantId || null) === (variantId || null)
      );

      if (match) {
        await db.delete(cartItems).where(eq(cartItems.id, match.id));
      }
    }

    // Return updated cart
    const items = await getCartWithItems(cart.id);
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);

    return apiSuccess({
      items,
      subtotal,
      guestToken: cart.guestSessionToken || null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/cart error:", err);
    return apiError("Internal server error", 500);
  }
}
