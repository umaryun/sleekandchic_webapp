import { and, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, products, productVariants, users } from "@/lib/db/schema";
import { toKobo } from "@/lib/money";
import { sendEmail } from "@/lib/email/send";
import { alertRecipients, getSettings } from "@/lib/services/settings";
import {
  contactMessageEmail,
  hasStatusEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  ownerNewOrderEmail,
  type LowStockLine,
  type OrderEmailData,
} from "@/lib/email/templates";

async function loadOrder(orderId: string): Promise<(OrderEmailData & { variantIds: string[] }) | null> {
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
    deliveryPayment: order.deliveryPayment,
    trackingNumber: order.trackingNumber,
    subtotal: order.subtotal !== null ? naira(order.subtotal) : items.reduce((s, i) => s + naira(i.price) * i.quantity, 0),
    discountAmount: naira(order.discountAmount),
    discountCode: order.discountCode,
    shippingFee: naira(order.shippingFee),
    totalAmount: naira(order.totalAmount),
    items: items.map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity, price: naira(i.price) })),
    variantIds: items.flatMap((i) => (i.variantId ? [i.variantId] : [])),
  };
}

/** The order's sizes that are now at or below the low-stock line. */
async function lowStockFor(variantIds: string[], threshold: number): Promise<LowStockLine[]> {
  if (variantIds.length === 0) return [];
  return db
    .select({
      productName: products.name,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stockQuantity,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        inArray(productVariants.id, variantIds),
        eq(productVariants.isActive, true),
        lte(productVariants.stockQuantity, threshold)
      )
    );
}

/**
 * A new order the shop should act on: a pay-on-delivery order when placed, or
 * a card order once paid. Emails the customer, and the shop unless new-order
 * alerts are turned off in Settings.
 */
export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const settings = await getSettings();
  const toShop = settings.notifications.newOrder
    ? ownerNewOrderEmail(
        order,
        alertRecipients(settings),
        settings.notifications.lowStock ? await lowStockFor(order.variantIds, settings.inventory.lowStockThreshold) : []
      )
    : null;
  await Promise.all([sendEmail(orderConfirmationEmail(order)), toShop && sendEmail(toShop)]);
}

/** A receipt for a sale staff recorded, when the customer gave an email. */
export async function notifyCustomerReceipt(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return false;
  return sendEmail(orderConfirmationEmail(order));
}

/** Tells the customer their order was shipped, delivered or cancelled. */
export async function notifyStatusChange(orderId: string, status: string) {
  if (!hasStatusEmail(status)) return;
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendEmail(orderStatusEmail(order, status as "shipped" | "delivered" | "cancelled"));
}

/** Emails the shop a contact-form message, unless message alerts are off. Returns whether it was sent. */
export async function notifyContactMessage(message: Parameters<typeof contactMessageEmail>[0]) {
  const settings = await getSettings();
  if (!settings.notifications.newMessage) return false;
  return sendEmail(contactMessageEmail(message, alertRecipients(settings)));
}
