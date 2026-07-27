import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-utils";

const trackingSchema = z.object({
  order_number: z.string().min(1),
  email: z.string().email(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = trackingSchema.safeParse(params);

    if (!parsed.success) {
      return apiError("order_number and email are required", 422);
    }

    const { order_number, email } = parsed.data;

    // Find order by number — check user email or guest email
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, order_number))
      .limit(1);

    if (!order) {
      return apiError("Order not found", 404);
    }

    // Verify email matches (check guest email or authenticated user)
    if (order.guestEmail !== email) {
      // Could also check the user's email from the users table
      if (order.userId) {
        const { users } = await import("@/lib/db/schema");
        const [user] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        if (!user || user.email !== email) {
          return apiError("Order not found", 404);
        }
      } else {
        return apiError("Order not found", 404);
      }
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return apiSuccess({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      items: items.map((i) => ({
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        color: i.color,
        size: i.size,
      })),
    });
  } catch (err) {
    console.error("GET /api/v1/store/orders/tracking error:", err);
    return apiError("Internal server error", 500);
  }
}
