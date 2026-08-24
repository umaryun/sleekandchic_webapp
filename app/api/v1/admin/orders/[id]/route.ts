import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  auditLog,
} from "@/lib/api-utils";

// ──────────────────────────────────────────────
// GET — Order details with line items
// ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    // Support lookup by UUID or Order Number
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const whereClause = isUuid
      ? or(eq(orders.id, id), eq(orders.orderNumber, id))
      : eq(orders.orderNumber, id);

    const [order] = await db
      .select()
      .from(orders)
      .where(whereClause)
      .limit(1);

    if (!order) {
      return apiError("Order not found", 404);
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    let customerName: string | null = null;
    let customerEmail: string | null = order.guestEmail || null;

    if (order.userId) {
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      if (user) {
        customerName = user.name;
        customerEmail = user.email;
      }
    }

    const response = apiSuccess({
      ...order,
      totalAmount: Number(order.totalAmount),
      customerName,
      customerEmail,
      items: items.map((item) => ({
        ...item,
        productName: item.name,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity,
      })),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/orders/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// DELETE — Delete order (Super Admin only)
// ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin(req);
    const { id } = await params;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const whereClause = isUuid
      ? or(eq(orders.id, id), eq(orders.orderNumber, id))
      : eq(orders.orderNumber, id);

    const [existing] = await db
      .select()
      .from(orders)
      .where(whereClause)
      .limit(1);

    if (!existing) {
      return apiError("Order not found", 404);
    }

    // Cascade delete items and order
    await db.delete(orderItems).where(eq(orderItems.orderId, existing.id));
    await db.delete(orders).where(eq(orders.id, existing.id));

    await auditLog(session.user.id, "delete", "order", {
      orderId: existing.id,
      orderNumber: existing.orderNumber,
      totalAmount: existing.totalAmount,
    });

    const response = apiSuccess({ deleted: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/admin/orders/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
