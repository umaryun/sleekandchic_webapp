import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, orderEvents, users } from "@/lib/db/schema";
import { asc, eq, or } from "drizzle-orm";
import { apiSuccess, apiError, requireAdmin, withCors } from "@/lib/api-utils";
import { allowedNextStatuses } from "@/lib/services/order-status";

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

    const events = await db
      .select({
        id: orderEvents.id,
        type: orderEvents.type,
        fromStatus: orderEvents.fromStatus,
        toStatus: orderEvents.toStatus,
        message: orderEvents.message,
        createdAt: orderEvents.createdAt,
        actorName: users.name,
      })
      .from(orderEvents)
      .leftJoin(users, eq(orderEvents.actorId, users.id))
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(asc(orderEvents.createdAt));
    // Orders from before the timeline existed still show when they were placed.
    const timeline = events.some((e) => e.type === "placed")
      ? events
      : [
          { id: `${order.id}-placed`, type: "placed", fromStatus: null, toStatus: "pending", message: null, createdAt: order.createdAt, actorName: null },
          ...events,
        ];

    const address = (order.shippingAddress ?? {}) as { firstName?: string; lastName?: string; phone?: string };
    const recipient = [address.firstName, address.lastName].filter(Boolean).join(" ");

    const response = apiSuccess({
      ...order,
      subtotal: order.subtotal !== null ? Number(order.subtotal) : null,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      // The person to deliver to; the account name when the address has none.
      customerName: recipient || customerName,
      customerPhone: address.phone ?? null,
      accountName: customerName,
      customerEmail,
      allowedStatuses: allowedNextStatuses(order),
      timeline,
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

// Orders are never deleted: they are the record of sales, stock and payments.
// Cancel instead (PUT /admin/orders with status "cancelled").

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
