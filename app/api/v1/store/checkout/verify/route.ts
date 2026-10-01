import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { koboToNaira, toKobo } from "@/lib/money";
import { PaystackError, verifyTransaction } from "@/lib/paystack";
import { findOrderForReference, markOrderPaid, orderAmountKobo } from "@/lib/services/orders";
import { afterResponse } from "@/lib/email/send";
import { notifyNewOrder } from "@/lib/email/notify";

/**
 * GET /api/v1/store/checkout/verify?reference=…
 * Called by the page Paystack returns the shopper to. Confirms the payment
 * with Paystack (never trusting the redirect alone) and returns the order.
 */
export async function GET(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "verify");
    if (limited) return limited;

    const reference = new URL(req.url).searchParams.get("reference")?.trim();
    if (!reference) return apiError("Missing payment reference", 400);

    const order = await findOrderForReference(reference);
    if (!order) return apiError("We couldn't find an order for this payment", 404);

    let current = order;
    if (order.paymentStatus !== "paid") {
      let tx;
      try {
        tx = await verifyTransaction(reference);
      } catch (err) {
        if (!(err instanceof PaystackError)) throw err;
        console.error(`Paystack verify failed for ${reference}:`, err);
        return apiError("We couldn't confirm your payment with Paystack. Refresh this page in a moment.", 502);
      }

      if (tx.status === "success") {
        if (tx.amount !== orderAmountKobo(order) || tx.currency !== "NGN") {
          console.error(
            `Paystack amount mismatch for ${order.orderNumber}: expected ${orderAmountKobo(order)} NGN kobo, got ${tx.amount} ${tx.currency}`
          );
          return apiError("The amount paid doesn't match this order. Please contact us with your order number.", 409);
        }
        const result = await db.transaction((t) => markOrderPaid(t, order.id, { reference, transactionId: tx.id }));
        current = result.order;
        // Whichever of this page and the webhook marks it paid sends the emails.
        if (result.changed) afterResponse(() => notifyNewOrder(order.id));
      }
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const address = (current.shippingAddress ?? {}) as { city?: string; state?: string; firstName?: string };

    return apiSuccess({
      status: current.paymentStatus === "paid" ? "paid" : "unpaid",
      orderNumber: current.orderNumber,
      orderStatus: current.status,
      canRetryPayment:
        current.paymentStatus !== "paid" &&
        current.status === "pending" &&
        (!current.expiresAt || current.expiresAt > new Date()),
      firstName: address.firstName ?? null,
      deliveryCity: address.city ?? null,
      deliveryState: address.state ?? null,
      shippingMethod: current.shippingMethod,
      subtotal: current.subtotal !== null ? koboToNaira(toKobo(current.subtotal)) : null,
      discountAmount: koboToNaira(toKobo(current.discountAmount)),
      shippingFee: koboToNaira(toKobo(current.shippingFee)),
      totalAmount: koboToNaira(toKobo(current.totalAmount)),
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        price: Number(i.price),
      })),
    });
  } catch (err) {
    console.error("GET /api/v1/store/checkout/verify error:", err);
    return apiError("Internal server error", 500);
  }
}
