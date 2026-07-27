import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, products, orderItems, productVariants } from "@/lib/db/schema";
import { eq, sql, count, sum, gte, and, lte } from "drizzle-orm";
import { apiSuccess, apiError, requireAdmin, withCors } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total revenue (paid orders)
    const [revenueResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));

    // Total orders
    const [orderCountResult] = await db
      .select({ total: count() })
      .from(orders);

    // Total products
    const [productCountResult] = await db
      .select({ total: count() })
      .from(products);

    // Low stock alerts (variants with stock < 5)
    const lowStockItems = await db
      .select({
        variantId: productVariants.id,
        productId: productVariants.productId,
        size: productVariants.size,
        color: productVariants.color,
        stock: productVariants.stockQuantity,
        productName: products.name,
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(lte(productVariants.stockQuantity, 5))
      .limit(20);

    // Orders by status
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .groupBy(orders.status);

    // Revenue last 30 days (daily aggregation)
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`.as("date"),
        revenue: sum(orders.totalAmount),
        orderCount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // Recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(10);

    const response = apiSuccess({
      revenue: {
        total: Number(revenueResult.total || 0),
        currency: "NGN",
      },
      orders: {
        total: orderCountResult.total,
        byStatus: ordersByStatus.reduce(
          (acc, row) => ({ ...acc, [row.status]: row.count }),
          {} as Record<string, number>
        ),
      },
      products: {
        total: productCountResult.total,
        lowStock: lowStockItems.map((item) => ({
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          color: item.color,
          stock: item.stock,
        })),
      },
      dailyRevenue: dailyRevenue.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue || 0),
        orders: d.orderCount,
      })),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
      })),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/analytics/overview error:", err);
    return apiError("Internal server error", 500);
  }
}
