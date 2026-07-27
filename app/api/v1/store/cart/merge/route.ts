import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { carts, cartItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError, requireAuth } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const userId = session.user.id;

    const body = await req.json();
    const guestToken = body.guestToken;

    if (!guestToken) {
      return apiError("guestToken is required", 400);
    }

    // Find guest cart
    const [guestCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.guestSessionToken, guestToken))
      .limit(1);

    if (!guestCart) {
      return apiSuccess({ merged: 0 });
    }

    // Find or create user cart
    let [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!userCart) {
      const [created] = await db
        .insert(carts)
        .values({ userId })
        .returning();
      userCart = created;
    }

    // Get guest items
    const guestItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    let mergedCount = 0;

    for (const item of guestItems) {
      // Check for existing matching item in user cart
      const userItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, userCart.id));

      const match = userItems.find(
        (i) =>
          i.productId === item.productId &&
          (i.variantId || null) === (item.variantId || null)
      );

      if (match) {
        // Merge quantities
        await db
          .update(cartItems)
          .set({ quantity: match.quantity + item.quantity })
          .where(eq(cartItems.id, match.id));
      } else {
        // Move item
        await db.insert(cartItems).values({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
      mergedCount++;
    }

    // Delete guest cart (cascade deletes its items)
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    return apiSuccess({ merged: mergedCount });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/cart/merge error:", err);
    return apiError("Internal server error", 500);
  }
}
