import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orderItems, orders, productVariants, stockMovements, type OrderSource } from "@/lib/db/schema";
import { koboToDecimal, toKobo } from "@/lib/money";
import { loadBuyNowLines, type DbOrTx } from "@/lib/services/cart";
import { cancelOrder, type ShippingAddress } from "@/lib/services/orders";
import { recordOrderEvent, transitionError, type OrderStatus } from "@/lib/services/order-status";

export class StaffOrderError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

// ──────────────────────────────────────────────
// Updating an order (the order screen and bulk actions)
// ──────────────────────────────────────────────

export interface StaffOrderChanges {
  status?: Exclude<OrderStatus, "paid">;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  /** Empty string clears it. */
  trackingNumber?: string;
  /** Added to the order's timeline. */
  note?: string;
}

/**
 * Applies staff changes to one order in the caller's transaction, following
 * the status rules in order-status.ts. Throws StaffOrderError when a change
 * isn't allowed. Returns the order before and after.
 */
export async function applyStaffChanges(tx: DbOrTx, orderId: string, changes: StaffOrderChanges, actorId: string) {
  const { status, paymentStatus, note } = changes;
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!row) throw new StaffOrderError("Order not found", 404);

  const nextPayment = paymentStatus ?? row.paymentStatus;
  if (status && status !== row.status) {
    const refusal = transitionError({ ...row, paymentStatus: nextPayment }, status);
    if (refusal) throw new StaffOrderError(refusal);
  }
  if (paymentStatus === "refunded" && row.paymentStatus !== "paid") {
    throw new StaffOrderError("Only a paid order can be marked refunded.");
  }

  const tracking = changes.trackingNumber?.trim();
  if (tracking !== undefined && tracking !== (row.trackingNumber ?? "")) {
    await tx
      .update(orders)
      .set({ trackingNumber: tracking || null, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await recordOrderEvent(tx, orderId, "tracking_updated", {
      actorId,
      message: tracking ? `Tracking: ${tracking}` : "Tracking details removed",
    });
  }

  if (paymentStatus && paymentStatus !== row.paymentStatus) {
    await tx
      .update(orders)
      .set({
        paymentStatus,
        ...(paymentStatus === "paid" ? { paidAt: row.paidAt ?? new Date(), expiresAt: null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    await recordOrderEvent(tx, orderId, "payment_status_changed", {
      from: row.paymentStatus,
      to: paymentStatus,
      actorId,
    });
  }

  if (status === "cancelled" && row.status !== "cancelled") {
    // Returns the order's stock and promo-code use, and adds the timeline entry.
    await cancelOrder(tx, orderId, "order_cancelled", { actorId, note: note || undefined });
  } else if (status && status !== row.status) {
    await tx.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await recordOrderEvent(tx, orderId, "status_changed", {
      from: row.status,
      to: status,
      actorId,
      message: note || null,
    });
  } else if (note) {
    await recordOrderEvent(tx, orderId, "note", { actorId, message: note });
  }

  const [after] = await tx.select().from(orders).where(eq(orders.id, orderId));
  return { before: row, after };
}

// ──────────────────────────────────────────────
// Recording a sale made off the website
// ──────────────────────────────────────────────

const money = z.number().min(0).max(100_000_000);

export const manualOrderSchema = z
  .object({
    source: z.enum(["whatsapp", "instagram", "in_store", "phone", "other"]),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional(),
          quantity: z.number().int().min(1).max(100),
          /** The agreed price each, when it differs from the shop price. */
          unitPrice: money.optional(),
        })
      )
      .min(1, "Add at least one item"),
    customer: z.object({
      firstName: z.string().trim().min(1, "Enter the customer's first name").max(100),
      lastName: z.string().trim().max(100).default(""),
      phone: z.string().trim().min(7, "Enter the customer's phone number").max(30),
      email: z.string().trim().toLowerCase().email("Enter a valid email, or leave it empty").optional().or(z.literal("")),
    }),
    shippingMethod: z.enum(["pickup", "standard", "express"]),
    address: z
      .object({
        street: z.string().trim().max(300).default(""),
        city: z.string().trim().max(100).default(""),
        state: z.string().trim().max(100).default(""),
      })
      .default({ street: "", city: "", state: "" }),
    deliveryFee: money.default(0),
    discountAmount: money.default(0),
    paymentMethod: z.enum(["transfer", "cash", "pos", "paystack"]),
    paid: z.boolean(),
    /** Walk-in sales the customer took with them are finished at once. */
    handedOver: z.boolean().default(false),
    note: z.string().trim().max(500).optional(),
  })
  .refine((o) => o.shippingMethod === "pickup" || (o.address.street && o.address.state), {
    path: ["address"],
    message: "Enter the delivery address and state",
  })
  .refine((o) => !o.handedOver || o.shippingMethod === "pickup", {
    path: ["handedOver"],
    message: "Only a pickup sale can be handed over straight away",
  });

export type ManualOrderInput = z.infer<typeof manualOrderSchema>;

const SOURCE_LABELS: Record<Exclude<OrderSource, "website">, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  in_store: "In the shop",
  phone: "Phone",
  other: "Other",
};

/**
 * Creates an order for a sale made on WhatsApp, Instagram, by phone or in the
 * shop. Stock is taken exactly as at checkout (and refused if there isn't
 * enough); prices default to the catalogue but staff may enter the agreed one.
 */
export async function createManualOrder(input: ManualOrderInput, actorId: string) {
  return db.transaction(async (tx) => {
    const lines = [];
    for (const item of input.items) {
      const [line] = await loadBuyNowLines(
        { productId: item.productId, variantId: item.variantId, quantity: item.quantity },
        tx,
        { lockVariants: true }
      );
      if (!line) throw new StaffOrderError("One of the products no longer exists. Remove it and try again.", 404);
      // Lines for the same size are checked together.
      const sameSize = input.items
        .filter((i) => i.productId === item.productId && (i.variantId ?? null) === line.variantId)
        .reduce((n, i) => n + i.quantity, 0);
      if (line.problem && !/no longer available/.test(line.problem)) throw new StaffOrderError(line.problem);
      if (line.problem) throw new StaffOrderError(`${line.problem}. Put it back on sale first, or remove it.`);
      if (line.stockAvailable !== null && line.stockAvailable < sameSize) {
        throw new StaffOrderError(`Only ${line.stockAvailable} left of ${line.productName} (${[line.color, line.size].filter(Boolean).join(", ")})`);
      }
      lines.push({ ...line, unitPriceKobo: item.unitPrice !== undefined ? toKobo(item.unitPrice) : line.unitPriceKobo });
    }

    const subtotalKobo = lines.reduce((sum, l) => sum + l.unitPriceKobo * l.quantity, 0);
    const discountKobo = Math.min(toKobo(input.discountAmount), subtotalKobo);
    const shippingKobo = input.shippingMethod === "pickup" ? 0 : toKobo(input.deliveryFee);
    const totalKobo = subtotalKobo - discountKobo + shippingKobo;

    const address: ShippingAddress = {
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      phone: input.customer.phone,
      street: input.address.street,
      city: input.address.city,
      state: input.address.state,
      country: "Nigeria",
    };
    const status: OrderStatus = input.handedOver && input.paid ? "delivered" : "processing";
    const now = new Date();

    const [order] = await tx
      .insert(orders)
      .values({
        userId: null,
        guestEmail: input.customer.email || null,
        subtotal: koboToDecimal(subtotalKobo),
        discountAmount: koboToDecimal(discountKobo),
        shippingFee: koboToDecimal(shippingKobo),
        totalAmount: koboToDecimal(totalKobo),
        shippingAddress: address,
        shippingMethod: input.shippingMethod,
        paymentMethod: input.paymentMethod,
        deliveryPayment: "online",
        status,
        paymentStatus: input.paid ? "paid" : "unpaid",
        paidAt: input.paid ? now : null,
        source: input.source,
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
          actorId,
        }))
      );
    }

    await recordOrderEvent(tx, order.id, "placed", {
      to: status,
      actorId,
      message: [`Recorded by staff · ${SOURCE_LABELS[input.source]}`, input.paid ? "Paid" : "Not paid yet", input.note]
        .filter(Boolean)
        .join(" · "),
    });
    return order;
  });
}

/** Orders by id for bulk actions, in the order asked. */
export async function ordersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status }).from(orders).where(inArray(orders.id, ids));
}
