import { NextRequest } from "next/server";
import { and, count, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages, orders, products, productVariants } from "@/lib/db/schema";
import { apiSuccess, internalError, requireAdmin, withCors } from "@/lib/api-utils";
import { getSettings } from "@/lib/services/settings";

/**
 * GET /admin/notifications — the counts behind the admin's sidebar badges,
 * and the latest order so the console can announce new ones. Polled, so kept
 * to a few cheap queries.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { inventory } = await getSettings();
    const [[work], [messages], [lowStock], [latest]] = await Promise.all([
      db
        .select({
          // Older pay-on-delivery orders waiting to be confirmed.
          toConfirm: sql<number>`count(*) filter (where ${orders.status} = 'pending' and ${orders.paymentMethod} is distinct from 'paystack')::int`,
          // Paid and being prepared: to pack and send.
          toShip: sql<number>`count(*) filter (where ${orders.status} in ('processing', 'paid'))::int`,
          // Sales staff recorded that haven't been paid for yet.
          awaitingPayment: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'unpaid' and ${orders.status} <> 'cancelled' and ${orders.paymentMethod} is distinct from 'paystack')::int`,
        })
        .from(orders),
      db.select({ unread: count() }).from(contactMessages).where(eq(contactMessages.status, "new")),
      db
        .select({ n: count() })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(products.status, "active"),
            eq(productVariants.isActive, true),
            lte(productVariants.stockQuantity, inventory.lowStockThreshold)
          )
        ),
      // The newest order the shop should act on: paid online, or recorded by staff.
      db
        .select({ id: orders.id, orderNumber: orders.orderNumber, totalAmount: orders.totalAmount, createdAt: orders.createdAt, paidAt: orders.paidAt })
        .from(orders)
        .where(and(ne(orders.status, "cancelled"), gt(sql`coalesce(${orders.paidAt}, ${orders.createdAt})`, sql`now() - interval '7 days'`), sql`(${orders.paymentStatus} = 'paid' or ${orders.paymentMethod} is distinct from 'paystack')`))
        .orderBy(desc(sql`coalesce(${orders.paidAt}, ${orders.createdAt})`))
        .limit(1),
    ]);

    return withCors(
      apiSuccess({
        orders: work,
        unreadMessages: messages.unread,
        lowStock: lowStock.n,
        latestOrder: latest
          ? { ...latest, totalAmount: Number(latest.totalAmount), at: (latest.paidAt ?? latest.createdAt).toISOString() }
          : null,
      }),
      req
    );
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/notifications", err);
  }
}
