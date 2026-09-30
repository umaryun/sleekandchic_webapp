import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError, getSession } from "@/lib/api-utils";

const trackingSchema = z.object({
  order_number: z.string().trim().min(1),
  // The email or phone number the order was placed with. Not needed when the
  // signed-in customer owns the order.
  contact: z.string().trim().optional(),
  email: z.string().trim().optional(), // older links
});

const digits = (s: string) => s.replace(/\D/g, "").replace(/^234/, "0");

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parsed = trackingSchema.safeParse(params);
    if (!parsed.success) return apiError("Enter your order number", 422);

    const orderNumber = parsed.data.order_number.toUpperCase();
    const contact = (parsed.data.contact ?? parsed.data.email ?? "").trim();

    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    // Same answer for "no such order" and "details don't match", so order
    // numbers can't be probed.
    const notFound = () => apiError("We couldn't find an order with those details", 404);
    if (!order) return notFound();

    const address = (order.shippingAddress ?? {}) as {
      firstName?: string;
      phone?: string;
      city?: string;
      state?: string;
    };

    const session = await getSession(req);
    const ownsOrder = Boolean(session?.user?.id && session.user.id === order.userId);

    if (!ownsOrder) {
      if (!contact) return notFound();
      let accountEmail: string | null = null;
      if (order.userId) {
        const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1);
        accountEmail = user?.email ?? null;
      }
      const emails = [order.guestEmail, accountEmail].filter(Boolean).map((e) => e!.toLowerCase());
      const matchesEmail = contact.includes("@") && emails.includes(contact.toLowerCase());
      const matchesPhone =
        !contact.includes("@") && Boolean(address.phone) && digits(contact).length >= 10 && digits(contact) === digits(address.phone!);
      if (!matchesEmail && !matchesPhone) return notFound();
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    return apiSuccess({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      subtotal: order.subtotal !== null ? Number(order.subtotal) : null,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      updatedAt: order.updatedAt,
      firstName: address.firstName ?? null,
      deliveryCity: address.city ?? null,
      deliveryState: address.state ?? null,
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
