import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, ilike, desc, count, and, or, gte, lte, sql, inArray } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
} from "@/lib/api-utils";
import { cancelOrder } from "@/lib/services/orders";
import { recordOrderEvent, transitionError } from "@/lib/services/order-status";
import { afterResponse } from "@/lib/email/send";
import { notifyStatusChange } from "@/lib/email/notify";

// ──────────────────────────────────────────────
// GET — List orders with filters
// ──────────────────────────────────────────────

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) return apiError("Invalid query parameters", 422);

    const { page, limit, status, search, from, to } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [];

    // Older orders marked "paid" are being prepared too.
    if (status === "processing" || status === "paid") conditions.push(inArray(orders.status, ["processing", "paid"]));
    else if (status) conditions.push(eq(orders.status, status));
    if (search?.trim()) {
      // Order number, email, recipient name or phone (any format).
      const term = `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const digits = search.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
      conditions.push(
        or(
          ilike(orders.orderNumber, term),
          ilike(orders.guestEmail, term),
          sql`concat_ws(' ', ${orders.shippingAddress}->>'firstName', ${orders.shippingAddress}->>'lastName') ilike ${term}`,
          ...(digits.length >= 4
            ? [sql`regexp_replace(${orders.shippingAddress}->>'phone', '[^0-9]', '', 'g') like ${`%${digits}%`}`]
            : [])
        )!
      );
    }
    if (from) conditions.push(gte(orders.createdAt, new Date(from)));
    if (to) conditions.push(lte(orders.createdAt, new Date(to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(whereClause);

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        guestEmail: orders.guestEmail,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        shippingMethod: orders.shippingMethod,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch user emails for orders with userId
    const userIds = [...new Set(rows.filter((r) => r.userId).map((r) => r.userId!))];
    const userEmails =
      userIds.length > 0
        ? await db
            .select({ id: users.id, email: users.email, name: users.name })
            .from(users)
            .where(sql`${users.id} IN ${userIds}`)
        : [];

    const userMap = new Map(userEmails.map((u) => [u.id, u]));

    const data = rows.map(({ shippingAddress, ...o }) => {
      const address = (shippingAddress ?? {}) as { firstName?: string; lastName?: string; phone?: string; state?: string };
      const recipient = [address.firstName, address.lastName].filter(Boolean).join(" ");
      return {
        ...o,
        totalAmount: Number(o.totalAmount),
        customerEmail: (o.userId ? userMap.get(o.userId)?.email : null) ?? o.guestEmail,
        // The person to deliver to; falls back to the account name.
        customerName: recipient || (o.userId ? userMap.get(o.userId)?.name : null) || null,
        customerPhone: address.phone ?? null,
        deliveryState: address.state ?? null,
      };
    });

    const response = apiSuccess({
      orders: data,
      pagination: paginationMeta(total, page, limit),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// PUT — Update order status
// ──────────────────────────────────────────────

const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  // Shown on the timeline, e.g. why it was cancelled.
  note: z.string().trim().max(500).optional(),
});

class Refusal extends Error {}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, updateOrderSchema);
    if (error) return error;
    const { orderId, status, paymentStatus, note } = data!;
    const actorId = session.user.id;

    let existing: typeof orders.$inferSelect;
    let updated: typeof orders.$inferSelect;
    try {
      ({ existing, updated } = await db.transaction(async (tx) => {
        const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
        if (!row) throw new Refusal("Order not found");

        const nextPayment = paymentStatus ?? row.paymentStatus;
        if (status && status !== row.status) {
          const refusal = transitionError({ ...row, paymentStatus: nextPayment }, status);
          if (refusal) throw new Refusal(refusal);
        }
        if (paymentStatus === "refunded" && row.paymentStatus !== "paid") {
          throw new Refusal("Only a paid order can be marked refunded.");
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
        return { existing: row, updated: after };
      }));
    } catch (err) {
      if (err instanceof Refusal) {
        return withCors(apiError(err.message, err.message === "Order not found" ? 404 : 409), req);
      }
      throw err;
    }

    if (status && status !== existing.status) {
      afterResponse(() => notifyStatusChange(orderId, status));
    }

    await auditLog(actorId, "update", "order", {
      orderId,
      orderNumber: existing.orderNumber,
      from: { status: existing.status, paymentStatus: existing.paymentStatus },
      to: { status: updated.status, paymentStatus: updated.paymentStatus },
    });

    const response = apiSuccess({
      ...updated,
      totalAmount: Number(updated.totalAmount),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PUT /api/v1/admin/orders error:", err);
    return apiError("Internal server error", 500);
  }
}
