import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cartItems,
  orderItems,
  orders,
  productVariants,
  stockMovements,
  type StockMovementReason,
} from "@/lib/db/schema";
import { koboToDecimal, toKobo } from "@/lib/money";
import { getDbShippingRates, getShippingQuotes, type ShippingQuote, type ShippingZone } from "@/lib/shipping";
import { findCart, loadCartLines, type CartLine, type DbOrTx } from "@/lib/services/cart";
import { recordOrderEvent } from "@/lib/services/order-status";
import {
  claimDiscount,
  evaluateDiscount,
  releaseDiscount,
  type DiscountRecord,
} from "@/lib/services/discounts";

export type Order = typeof orders.$inferSelect;
export type ShippingMethod = "standard" | "express";
export type PaymentMethod = "paystack" | "cod";

/** How long an unpaid card order holds its stock before it is cancelled. */
export const CARD_PAYMENT_WINDOW_MS = 60 * 60 * 1000;

export class CheckoutError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

// ──────────────────────────────────────────────
// Quote: the single source of every total shown or charged
// ──────────────────────────────────────────────

export interface Quote {
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  totalKobo: number;
  itemCount: number;
  discount: DiscountRecord | null;
  discountError: string | null;
  shipping: ShippingQuote;
  shippingOptions: { standard: ShippingQuote; express: ShippingQuote };
  problems: string[];
}

export async function quoteLines(
  lines: CartLine[],
  input: { state: string; shippingMethod: ShippingMethod; discountCode?: string | null },
  tx: DbOrTx = db,
  // Pass rates loaded beforehand when quoting inside a transaction: loading
  // them there would need a second connection while this one is held.
  ratesMap?: Record<string, ShippingZone>
): Promise<Quote> {
  const subtotalKobo = lines.reduce((sum, l) => sum + l.unitPriceKobo * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  let discount: DiscountRecord | null = null;
  let discountKobo = 0;
  let discountError: string | null = null;
  if (input.discountCode?.trim()) {
    const result = await evaluateDiscount(input.discountCode, subtotalKobo, tx);
    if (result.ok) {
      discount = result.discount;
      discountKobo = result.amountKobo;
    } else {
      discountError = result.error;
    }
  }

  const rates = ratesMap ?? (await getDbShippingRates());
  const shippingOptions = getShippingQuotes(
    input.state,
    (subtotalKobo - discountKobo) / 100,
    Math.max(itemCount, 1),
    rates
  );
  const shipping = shippingOptions[input.shippingMethod];
  const shippingKobo = toKobo(shipping.fee);

  return {
    subtotalKobo,
    discountKobo,
    shippingKobo,
    totalKobo: subtotalKobo - discountKobo + shippingKobo,
    itemCount,
    discount,
    discountError,
    shipping,
    shippingOptions,
    problems: lines.flatMap((l) => (l.problem ? [l.problem] : [])),
  };
}

// ──────────────────────────────────────────────
// Placing an order
// ──────────────────────────────────────────────

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface PlaceOrderInput {
  userId: string | null;
  guestToken: string | null;
  guestEmail: string | null;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  discountCode?: string | null;
}

/**
 * Creates the order in one transaction: prices come from the catalogue, stock
 * is locked and taken, and the promo code is claimed. Pay-on-delivery orders
 * clear the bag now; card orders keep it until payment succeeds.
 */
export async function placeOrder(input: PlaceOrderInput) {
  const ratesMap = await getDbShippingRates();
  return db.transaction(async (tx) => {
    const cart = await findCart(input.userId, input.guestToken, tx);
    if (!cart) throw new CheckoutError("Your bag is empty");

    // A new checkout from the same bag replaces an unpaid card order that is
    // still holding stock.
    const previous = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.cartId, cart.id),
          eq(orders.paymentMethod, "paystack"),
          eq(orders.paymentStatus, "unpaid"),
          eq(orders.status, "pending")
        )
      );
    for (const p of previous) {
      await cancelOrder(tx, p.id, "order_cancelled", { onlyIfUnpaid: true, note: "Replaced by a newer checkout" });
    }

    const lines = await loadCartLines(cart.id, tx, { lockVariants: true });
    if (lines.length === 0) throw new CheckoutError("Your bag is empty");

    const quote = await quoteLines(
      lines,
      {
        state: input.shippingAddress.state,
        shippingMethod: input.shippingMethod,
        discountCode: input.discountCode,
      },
      tx,
      ratesMap
    );
    if (quote.problems.length > 0) throw new CheckoutError(quote.problems.join(". "), 409);
    if (input.discountCode?.trim() && quote.discountError) throw new CheckoutError(quote.discountError);
    if (quote.discount && !(await claimDiscount(tx, quote.discount.id))) {
      throw new CheckoutError(`The code ${quote.discount.code} has been fully used`, 409);
    }

    const [order] = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        guestEmail: input.guestEmail,
        subtotal: koboToDecimal(quote.subtotalKobo),
        discountAmount: koboToDecimal(quote.discountKobo),
        shippingFee: koboToDecimal(quote.shippingKobo),
        totalAmount: koboToDecimal(quote.totalKobo),
        shippingAddress: input.shippingAddress,
        shippingMethod: input.shippingMethod,
        paymentMethod: input.paymentMethod,
        discountCode: quote.discount?.code ?? null,
        status: "pending",
        paymentStatus: "unpaid",
        cartId: cart.id,
        expiresAt:
          input.paymentMethod === "paystack" ? new Date(Date.now() + CARD_PAYMENT_WINDOW_MS) : null,
      })
      .returning();

    await tx.insert(orderItems).values(
      lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId,
        name: line.productName,
        price: koboToDecimal(line.unitPriceKobo),
        quantity: line.quantity,
        color: line.color,
        size: line.size,
      }))
    );

    const tracked = lines.filter((l) => l.variantId && l.stockAvailable !== null);
    for (const line of tracked) {
      await tx
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${line.quantity}` })
        .where(eq(productVariants.id, line.variantId!));
    }
    if (tracked.length > 0) {
      await tx.insert(stockMovements).values(
        tracked.map((line) => ({
          variantId: line.variantId,
          productId: line.productId,
          delta: -line.quantity,
          reason: "order" as const,
          orderId: order.id,
        }))
      );
    }

    await recordOrderEvent(tx, order.id, "placed", {
      to: "pending",
      actorId: input.userId,
      message: input.paymentMethod === "cod" ? "Pay on delivery" : "Waiting for card payment",
    });

    if (input.paymentMethod === "cod") {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }

    return { order, quote, lines };
  });
}

// ──────────────────────────────────────────────
// Cancelling and expiring
// ──────────────────────────────────────────────

/**
 * Cancels an order and returns what it took: the stock recorded against it in
 * stock_movements (orders placed before stock tracking return nothing) and its
 * promo-code use. Returns false if the order was already cancelled, or was paid
 * and `onlyIfUnpaid` is set.
 */
export async function cancelOrder(
  tx: DbOrTx,
  orderId: string,
  reason: Extract<StockMovementReason, "order_cancelled" | "order_expired">,
  opts: { actorId?: string | null; note?: string; onlyIfUnpaid?: boolean } = {}
): Promise<boolean> {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!order || order.status === "cancelled") return false;
  if (opts.onlyIfUnpaid && order.paymentStatus === "paid") return false;

  await tx
    .update(orders)
    .set({ status: "cancelled", expiresAt: null, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const held = await tx
    .select({
      variantId: stockMovements.variantId,
      productId: stockMovements.productId,
      net: sql<number>`sum(${stockMovements.delta})::int`,
    })
    .from(stockMovements)
    .where(eq(stockMovements.orderId, orderId))
    .groupBy(stockMovements.variantId, stockMovements.productId);

  const toReturn = held.filter((h) => h.variantId && h.net < 0);
  for (const h of toReturn) {
    await tx
      .update(productVariants)
      .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${-h.net}` })
      .where(eq(productVariants.id, h.variantId!));
  }
  if (toReturn.length > 0) {
    await tx.insert(stockMovements).values(
      toReturn.map((h) => ({
        variantId: h.variantId,
        productId: h.productId,
        delta: -h.net,
        reason,
        orderId,
        actorId: opts.actorId ?? null,
        note: opts.note ?? null,
      }))
    );
  }

  if (order.discountCode) await releaseDiscount(tx, order.discountCode);
  await recordOrderEvent(tx, orderId, "cancelled", {
    from: order.status,
    to: "cancelled",
    actorId: opts.actorId,
    message: opts.note ?? (toReturn.length > 0 ? "Stock returned" : null),
  });
  return true;
}

/** Cancels unpaid card orders past their payment window and frees their stock. */
export async function expireStaleOrders() {
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.paymentMethod, "paystack"),
        eq(orders.paymentStatus, "unpaid"),
        eq(orders.status, "pending"),
        lt(orders.expiresAt, new Date())
      )
    );
  let expired = 0;
  for (const { id } of stale) {
    const done = await db.transaction((tx) =>
      cancelOrder(tx, id, "order_expired", { onlyIfUnpaid: true, note: "Card payment not completed in time" })
    );
    if (done) expired++;
  }
  return expired;
}

// ──────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────

/**
 * Marks an order paid. Safe to call more than once (webhook and return page
 * both call it). A payment that arrives after the order expired reinstates the
 * order and takes its stock again, which may leave a variant negative; the
 * inventory screen shows that oversell rather than hiding it.
 */
export async function markOrderPaid(
  tx: DbOrTx,
  orderId: string,
  payment: { reference: string; transactionId: string | number }
): Promise<{ order: Order; changed: boolean }> {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.paymentStatus === "paid") return { order, changed: false };

  const reinstated = order.status === "cancelled";
  const [updated] = await tx
    .update(orders)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      paymentReference: payment.reference,
      paymentIntentId: String(payment.transactionId),
      // A paid card order is confirmed and goes to preparing; fulfilment
      // already under way is left alone.
      status: order.status === "pending" || reinstated ? "processing" : order.status,
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  if (reinstated) {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const withVariant = items.filter((i) => i.variantId);
    for (const item of withVariant) {
      await tx
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId!));
    }
    if (withVariant.length > 0) {
      await tx.insert(stockMovements).values(
        withVariant.map((item) => ({
          variantId: item.variantId,
          productId: item.productId,
          delta: -item.quantity,
          reason: "late_payment" as const,
          orderId,
          note: "Paid after the order had expired",
        }))
      );
    }
  }

  await recordOrderEvent(tx, orderId, "payment_received", {
    from: order.status,
    to: updated.status,
    message: reinstated
      ? `Paid by card after the order had expired (ref ${payment.reference}); stock taken again`
      : `Paid by card (ref ${payment.reference})`,
  });

  if (order.cartId) await tx.delete(cartItems).where(eq(cartItems.cartId, order.cartId));
  return { order: updated, changed: true };
}

/** Kobo Paystack should charge for an order. */
export function orderAmountKobo(order: Pick<Order, "totalAmount">) {
  return toKobo(order.totalAmount);
}

/**
 * Finds the order a Paystack reference belongs to. References are
 * `<orderNumber>-<attempt>`, so a payment made on an older attempt (after a
 * retry replaced the stored reference) still resolves to its order.
 */
export async function findOrderForReference(reference: string, orderId?: string | null, tx: DbOrTx = db) {
  if (orderId) {
    const [byId] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (byId) return byId;
  }
  const [byReference] = await tx.select().from(orders).where(eq(orders.paymentReference, reference)).limit(1);
  if (byReference) return byReference;
  const orderNumber = reference.slice(0, reference.lastIndexOf("-"));
  if (!orderNumber) return null;
  const [byNumber] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return byNumber ?? null;
}
