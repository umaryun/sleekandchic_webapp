import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { orders, orderItems, carts, cartItems, productVariants } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Verify Paystack webhook signature
    const body = await req.text();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    const signature = req.headers.get("x-paystack-signature");

    if (hash !== signature) {
      console.error("Paystack webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;

      // Find order by reference
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.paymentReference, reference))
        .limit(1);

      if (!order) {
        console.error("Paystack webhook: order not found for ref:", reference);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Verify amount matches (Paystack sends in kobo)
      const expectedKobo = Math.round(Number(order.totalAmount) * 100);
      if (amount !== expectedKobo) {
        console.error(
          `Paystack webhook: amount mismatch. Expected ${expectedKobo}, got ${amount}`
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Update order status
      await db
        .update(orders)
        .set({
          status: "paid",
          paymentStatus: "paid",
          paymentIntentId: event.data.id?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      // Decrement stock for ordered variants
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        if (item.variantId) {
          await db
            .update(productVariants)
            .set({
              stockQuantity: sql`GREATEST(${productVariants.stockQuantity} - ${item.quantity}, 0)`,
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      // Clear the user's cart after successful payment
      if (order.userId) {
        const [cart] = await db
          .select()
          .from(carts)
          .where(eq(carts.userId, order.userId))
          .limit(1);

        if (cart) {
          await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        }
      }

      console.log(`Order ${order.orderNumber} paid successfully`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    // Return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
