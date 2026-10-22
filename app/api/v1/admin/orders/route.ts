import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, ilike, desc, count, and, or, gte, lt, sql, inArray, ne, type SQL } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
  internalError,
} from "@/lib/api-utils";
import { applyStaffChanges, createManualOrder, manualOrderSchema, StaffOrderError } from "@/lib/services/staff-orders";
import { customerKey } from "@/lib/services/customers";
import { afterResponse } from "@/lib/email/send";
import { notifyCustomerReceipt, notifyStatusChange } from "@/lib/email/notify";

// ──────────────────────────────────────────────
// GET — List orders with filters
// ──────────────────────────────────────────────

const LAGOS_OFFSET = "+01:00";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  shippingMethod: z.enum(["standard", "express", "pickup"]).optional(),
  // "manual" is every sale staff recorded, whatever the channel.
  source: z.enum(["website", "manual", "whatsapp", "instagram", "in_store", "phone", "other"]).optional(),
  search: z.string().optional(),
  // Lagos calendar days, YYYY-MM-DD, both included.
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function statusCondition(status: string) {
  // Older orders marked "paid" are being prepared too.
  if (status === "processing" || status === "paid") return inArray(orders.status, ["processing", "paid"]);
  return eq(orders.status, status as "pending");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Invalid query parameters", 422), req);

    const { page, limit, status, paymentStatus, shippingMethod, source, search, from, to } = parsed.data;
    const offset = (page - 1) * limit;

    // Every filter except status, so the status tabs can show their counts.
    const filters: SQL[] = [];
    if (paymentStatus) filters.push(eq(orders.paymentStatus, paymentStatus));
    if (shippingMethod) filters.push(eq(orders.shippingMethod, shippingMethod));
    if (source === "manual") filters.push(ne(orders.source, "website"));
    else if (source) filters.push(eq(orders.source, source));
    if (search?.trim()) {
      // Order number, email, recipient name or phone (any format).
      const term = `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const digits = search.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
      filters.push(
        or(
          ilike(orders.orderNumber, term),
          ilike(orders.guestEmail, term),
          ilike(orders.trackingNumber, term),
          sql`concat_ws(' ', ${orders.shippingAddress}->>'firstName', ${orders.shippingAddress}->>'lastName') ilike ${term}`,
          ...(digits.length >= 4
            ? [sql`regexp_replace(${orders.shippingAddress}->>'phone', '[^0-9]', '', 'g') like ${`%${digits}%`}`]
            : [])
        )!
      );
    }
    if (from) filters.push(gte(orders.createdAt, new Date(`${from}T00:00:00${LAGOS_OFFSET}`)));
    if (to) filters.push(lt(orders.createdAt, new Date(new Date(`${to}T00:00:00${LAGOS_OFFSET}`).getTime() + 86_400_000)));

    const whereClause = and(...filters, status ? statusCondition(status) : undefined);

    const [[{ total }], statusCounts] = await Promise.all([
      db.select({ total: count() }).from(orders).where(whereClause),
      db
        .select({ status: orders.status, n: count() })
        .from(orders)
        .where(filters.length ? and(...filters) : undefined)
        .groupBy(orders.status),
    ]);

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        guestEmail: orders.guestEmail,
        totalAmount: orders.totalAmount,
        shippingFee: orders.shippingFee,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        shippingMethod: orders.shippingMethod,
        deliveryPayment: orders.deliveryPayment,
        shippingAddress: orders.shippingAddress,
        source: orders.source,
        trackingNumber: orders.trackingNumber,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = rows.map((r) => r.id);
    const userIds = [...new Set(rows.filter((r) => r.userId).map((r) => r.userId!))];
    const [accounts, items] = await Promise.all([
      userIds.length > 0
        ? db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(inArray(users.id, userIds))
        : [],
      ids.length > 0
        ? db
            .select({ orderId: orderItems.orderId, name: orderItems.name, quantity: orderItems.quantity, size: orderItems.size, color: orderItems.color })
            .from(orderItems)
            .where(inArray(orderItems.orderId, ids))
        : [],
    ]);
    const userMap = new Map(accounts.map((u) => [u.id, u]));
    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);

    const data = rows.map(({ shippingAddress, ...o }) => {
      const address = (shippingAddress ?? {}) as { firstName?: string; lastName?: string; phone?: string; street?: string; city?: string; state?: string };
      const recipient = [address.firstName, address.lastName].filter(Boolean).join(" ");
      const email = (o.userId ? userMap.get(o.userId)?.email : null) ?? o.guestEmail;
      const lines = itemsByOrder.get(o.id) ?? [];
      return {
        ...o,
        totalAmount: Number(o.totalAmount),
        shippingFee: Number(o.shippingFee),
        customerEmail: email,
        // The person to deliver to; falls back to the account name.
        customerName: recipient || (o.userId ? userMap.get(o.userId)?.name : null) || null,
        customerPhone: address.phone ?? null,
        customerId: customerKey({ userId: o.userId, email, phone: address.phone }),
        deliveryState: address.state ?? null,
        deliveryAddress: [address.street, address.city, address.state].filter(Boolean).join(", ") || null,
        itemCount: lines.reduce((n, l) => n + l.quantity, 0),
        itemsSummary: lines
          .map((l) => `${l.quantity}× ${l.name}${l.size || l.color ? ` (${[l.color, l.size].filter(Boolean).join(", ")})` : ""}`)
          .join(", "),
      };
    });

    const byStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r.n])) as Record<string, number>;
    const counts = {
      all: statusCounts.reduce((n, r) => n + r.n, 0),
      pending: byStatus.pending ?? 0,
      processing: (byStatus.processing ?? 0) + (byStatus.paid ?? 0),
      shipped: byStatus.shipped ?? 0,
      delivered: byStatus.delivered ?? 0,
      cancelled: byStatus.cancelled ?? 0,
    };

    return withCors(apiSuccess({ orders: data, counts, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/orders", err);
  }
}

// ──────────────────────────────────────────────
// POST — Record a sale made off the website
// ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, manualOrderSchema.and(z.object({ emailReceipt: z.boolean().default(false) })));
    if (error) return withCors(error, req);

    let order;
    try {
      order = await createManualOrder(data!, session.user.id);
    } catch (err) {
      if (err instanceof StaffOrderError) return withCors(apiError(err.message, err.status), req);
      throw err;
    }

    if (data!.emailReceipt && data!.customer.email) afterResponse(() => notifyCustomerReceipt(order.id));
    await auditLog(session.user.id, "create", "order", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      source: order.source,
      total: Number(order.totalAmount),
    });
    return withCors(apiSuccess({ ...order, totalAmount: Number(order.totalAmount) }, 201), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/orders", err);
  }
}

// ──────────────────────────────────────────────
// PUT — Update one order
// ──────────────────────────────────────────────

const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  // GIG waybill, or driver and park details. Empty clears it.
  trackingNumber: z.string().trim().max(120).optional(),
  // Shown on the timeline, e.g. why it was cancelled.
  note: z.string().trim().max(500).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, updateOrderSchema);
    if (error) return withCors(error, req);
    const { orderId, ...changes } = data!;
    const actorId = session.user.id;

    let before, after;
    try {
      ({ before, after } = await db.transaction((tx) => applyStaffChanges(tx, orderId, changes, actorId)));
    } catch (err) {
      if (err instanceof StaffOrderError) return withCors(apiError(err.message, err.status), req);
      throw err;
    }

    if (changes.status && changes.status !== before.status) {
      afterResponse(() => notifyStatusChange(orderId, changes.status!));
    }

    await auditLog(actorId, "update", "order", {
      orderId,
      orderNumber: before.orderNumber,
      from: { status: before.status, paymentStatus: before.paymentStatus },
      to: { status: after.status, paymentStatus: after.paymentStatus },
      ...(changes.trackingNumber !== undefined ? { trackingNumber: after.trackingNumber } : {}),
    });

    return withCors(apiSuccess({ ...after, totalAmount: Number(after.totalAmount) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("PUT /api/v1/admin/orders", err);
  }
}
