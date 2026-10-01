import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store";
import { toKobo } from "@/lib/money";
import { sendEmail } from "@/lib/email/send";
import {
  hasStatusEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "@/lib/email/templates";

async function loadOrder(orderId: string): Promise<OrderEmailData | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  let email = order.guestEmail;
  if (order.userId) {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1);
    email = user?.email ?? email;
  }
  if (!email) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const a = (order.shippingAddress ?? {}) as Partial<Record<"firstName" | "lastName" | "phone" | "street" | "city" | "state", string>>;
  const naira = (v: string | null) => toKobo(v) / 100;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    phone: a.phone ?? "",
    street: a.street ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    email,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingMethod: order.shippingMethod,
    subtotal: order.subtotal !== null ? naira(order.subtotal) : items.reduce((s, i) => s + naira(i.price) * i.quantity, 0),
    discountAmount: naira(order.discountAmount),
    discountCode: order.discountCode,
    shippingFee: naira(order.shippingFee),
    totalAmount: naira(order.totalAmount),
    items: items.map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity, price: naira(i.price) })),
  };
}

const ownerEmail = () => env.OWNER_NOTIFICATION_EMAIL || STORE.email;

/**
 * A new order the shop should act on: a pay-on-delivery order when placed, or
 * a card order once paid. Emails the customer and the shop.
 */
export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await Promise.all([sendEmail(orderConfirmationEmail(order)), sendEmail(ownerNewOrderEmail(order, ownerEmail()))]);
}

/** Tells the customer their order was shipped, delivered or cancelled. */
export async function notifyStatusChange(orderId: string, status: string) {
  if (!hasStatusEmail(status)) return;
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendEmail(orderStatusEmail(order, status as "shipped" | "delivered" | "cancelled"));
}
