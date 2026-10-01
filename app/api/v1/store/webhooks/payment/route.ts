import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentEvents } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { findOrderForReference, markOrderPaid, orderAmountKobo } from "@/lib/services/orders";
import { afterResponse } from "@/lib/email/send";
import { notifyNewOrder } from "@/lib/email/notify";

function signatureMatches(body: string, signature: string | null, key: string) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", key).update(body).digest();
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/**
 * Paystack webhook. Each event is recorded under its unique id in the same
 * transaction that updates the order, so a retried event is skipped and a
 * failure rolls back cleanly. Failures return 500 so Paystack retries.
 */
export async function POST(req: NextRequest) {
  if (!env.PAYSTACK_SECRET_KEY) {
    console.error("Paystack webhook received but PAYSTACK_SECRET_KEY is not set");
    return NextResponse.json({ error: "Payments are not configured" }, { status: 500 });
  }

  const body = await req.text();
  if (!signatureMatches(body, req.headers.get("x-paystack-signature"), env.PAYSTACK_SECRET_KEY)) {
    console.error("Paystack webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: { id: number; reference: string; amount: number; currency: string; metadata?: { orderId?: string } | null } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { id, reference, amount, currency, metadata } = event.data;
  try {
    const paidOrderId = await db.transaction(async (tx): Promise<string | null> => {
      const inserted = await tx
        .insert(paymentEvents)
        .values({
          provider: "paystack",
          eventId: `${event.event}:${id}`,
          eventType: event.event,
          reference,
          payload: event,
        })
        .onConflictDoNothing()
        .returning({ id: paymentEvents.id });
      if (inserted.length === 0) return null; // already processed

      const order = await findOrderForReference(reference, metadata?.orderId, tx);
      if (!order) {
        // Kept in payment_events for reconciliation.
        console.error(`Paystack webhook: no order for reference ${reference}`);
        return null;
      }
      await tx.update(paymentEvents).set({ orderId: order.id }).where(eq(paymentEvents.id, inserted[0].id));

      if (amount !== orderAmountKobo(order) || currency !== "NGN") {
        console.error(
          `Paystack webhook: amount mismatch for ${order.orderNumber}. Expected ${orderAmountKobo(order)} NGN kobo, got ${amount} ${currency}`
        );
        return null;
      }

      const { changed } = await markOrderPaid(tx, order.id, { reference, transactionId: id });
      if (!changed) return null;
      console.log(`Order ${order.orderNumber} paid (Paystack ${reference})`);
      return order.id;
    });
    if (paidOrderId) afterResponse(() => notifyNewOrder(paidOrderId));
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paystack webhook processing failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
