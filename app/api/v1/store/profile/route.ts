import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, orders, orderItems } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { apiSuccess, apiError, getSession, parseBody } from "@/lib/api-utils";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Fetch user details
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return apiError("User not found", 404);
    }

    // Fetch user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // All items in one query, grouped by order.
    const allItems =
      userOrders.length > 0
        ? await db.select().from(orderItems).where(inArray(orderItems.orderId, userOrders.map((o) => o.id)))
        : [];
    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const ordersWithItems = userOrders.map((o) => {
      const items = itemsByOrder.get(o.id) ?? [];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        subtotal:
          o.subtotal !== null ? Number(o.subtotal) : items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
        totalAmount: Number(o.totalAmount),
        discountAmount: Number(o.discountAmount),
        shippingFee: Number(o.shippingFee),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        })),
      };
    });

    return apiSuccess({
      profile: user,
      orders: ordersWithItems,
    });
  } catch (err) {
    console.error("GET /api/v1/store/profile error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;
    const { data, error } = await parseBody(req, updateProfileSchema);

    if (error || !data) return error!;

    const updates: Partial<{ name: string; phone: string; updatedAt: Date }> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
      });

    return apiSuccess({
      profile: updatedUser,
    });
  } catch (err) {
    console.error("PATCH /api/v1/store/profile error:", err);
    return apiError("Internal server error", 500);
  }
}
