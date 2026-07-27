import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, ilike, desc, count, and, gte, lte, sql } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
} from "@/lib/api-utils";

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

    if (status) conditions.push(eq(orders.status, status));
    if (search) conditions.push(ilike(orders.orderNumber, `%${search}%`));
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

    const data = rows.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      customerEmail: o.userId
        ? userMap.get(o.userId)?.email
        : o.guestEmail,
      customerName: o.userId
        ? userMap.get(o.userId)?.name
        : null,
    }));

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
  status: z
    .enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, updateOrderSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, data!.orderId))
      .limit(1);

    if (!existing) return apiError("Order not found", 404);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data!.status) updates.status = data!.status;
    if (data!.paymentStatus) updates.paymentStatus = data!.paymentStatus;

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, data!.orderId))
      .returning();

    await auditLog(session.user.id, "update", "order", {
      orderId: data!.orderId,
      orderNumber: existing.orderNumber,
      from: { status: existing.status, paymentStatus: existing.paymentStatus },
      to: { status: data!.status, paymentStatus: data!.paymentStatus },
    });

    const response = apiSuccess({
      ...updated,
      totalAmount: Number(updated.totalAmount),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
