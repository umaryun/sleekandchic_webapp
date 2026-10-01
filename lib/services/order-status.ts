import { orderEvents, type OrderEventType } from "@/lib/db/schema";
import type { DbOrTx } from "@/lib/services/cart";

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

/** Fulfilment steps in order. "paid" (older orders only) sits with "processing". */
const STEP: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

/** What staff see. "processing" reads as "Preparing". */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Preparing",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface OrderState {
  status: OrderStatus;
  paymentMethod: "paystack" | "cod" | null;
  paymentStatus: "unpaid" | "paid" | "refunded";
}

/**
 * Why an order can't move to `to`, or null if it can. Orders only move
 * forward (steps may be skipped), can be cancelled until delivered, and a card
 * order waits for its payment before it is prepared.
 */
export function transitionError(order: OrderState, to: OrderStatus): string | null {
  const from = order.status;
  if (from === to) return null;
  if (from === "cancelled") {
    return "Cancelled orders can't be reopened; their stock has been returned. Ask the customer to order again.";
  }
  if (from === "delivered") return "This order has been delivered and can't be changed.";
  if (to === "cancelled") return null;
  if (to === "paid") return "Use the payment status to record a payment.";
  if (STEP[to] < STEP[from]) return `An order can't go back from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`;
  if (order.paymentMethod === "paystack" && order.paymentStatus !== "paid") {
    return "This card order hasn't been paid yet. Wait for the payment, or cancel the order.";
  }
  return null;
}

/** The statuses staff can choose next, for the order screen. */
export function allowedNextStatuses(order: OrderState): OrderStatus[] {
  const candidates: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];
  return candidates.filter((to) => to !== order.status && transitionError(order, to) === null);
}

/** Adds an entry to an order's timeline. */
export async function recordOrderEvent(
  tx: DbOrTx,
  orderId: string,
  type: OrderEventType,
  details: { from?: string | null; to?: string | null; actorId?: string | null; message?: string | null } = {}
) {
  await tx.insert(orderEvents).values({
    orderId,
    type,
    fromStatus: details.from ?? null,
    toStatus: details.to ?? null,
    actorId: details.actorId ?? null,
    message: details.message ?? null,
  });
}
