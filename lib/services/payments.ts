import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { initializeTransaction, paymentReference } from "@/lib/paystack";
import { orderAmountKobo } from "@/lib/services/orders";

/** Opens a Paystack transaction for an order and records its reference. */
export async function startCardPayment(
  order: { id: string; orderNumber: string; totalAmount: string },
  email: string
) {
  const payment = await initializeTransaction({
    email,
    amountKobo: orderAmountKobo(order),
    reference: paymentReference(order.orderNumber),
    callbackUrl: `${env.BETTER_AUTH_URL}/checkout/complete`,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });
  await db
    .update(orders)
    .set({ paymentReference: payment.reference, updatedAt: new Date() })
    .where(eq(orders.id, order.id));
  return { authorization_url: payment.authorizationUrl, reference: payment.reference };
}
