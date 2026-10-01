import { and, asc, count, desc, eq, gte, lt, lte, ne, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products, productVariants } from "@/lib/db/schema";

// The shop runs on Lagos time (WAT, UTC+1 all year, no daylight saving).
// Timestamps are stored in UTC, so a Lagos day starts at 23:00 UTC.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const LOW_STOCK_THRESHOLD = 5;

/** Midnight in Lagos at the start of the day containing `at`. */
export function lagosDayStart(at: Date): Date {
  const local = at.getTime() + LAGOS_OFFSET_MS;
  return new Date(local - (local % DAY_MS) - LAGOS_OFFSET_MS);
}

/** The Lagos calendar date of `at`, as YYYY-MM-DD. */
export function lagosDate(at: Date): string {
  return new Date(at.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

// When the money came in. Orders paid before paidAt was recorded fall back to
// when they were placed.
const paidMoment = sql`coalesce(${orders.paidAt}, ${orders.createdAt})`;
const isPaid = eq(orders.paymentStatus, "paid");

/** From `from` up to `to` (exclusive), or up to now when `to` is omitted. */
async function revenueSince(from: Date, to?: Date) {
  const [row] = await db
    .select({ total: sum(orders.totalAmount), orders: count() })
    .from(orders)
    .where(and(isPaid, gte(paidMoment, from.toISOString()), to ? lt(paidMoment, to.toISOString()) : undefined));
  return { amount: Number(row.total ?? 0), orders: row.orders };
}

async function ordersPlacedSince(from: Date, to?: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, from), to ? lt(orders.createdAt, to) : undefined, ne(orders.status, "cancelled")));
  return row.n;
}

/** Percentage change, or null when there's nothing to compare with. */
function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getOverview(now = new Date()) {
  const today = lagosDayStart(now);
  const windowStart = new Date(today.getTime() - 29 * DAY_MS); // 30 days including today
  const previousStart = new Date(windowStart.getTime() - 30 * DAY_MS);

  const [allTime, todayRevenue, last30, previous30, placed30, placedPrevious30] = await Promise.all([
    db.select({ total: sum(orders.totalAmount) }).from(orders).where(isPaid),
    revenueSince(today),
    revenueSince(windowStart),
    revenueSince(previousStart, windowStart),
    ordersPlacedSince(windowStart),
    ordersPlacedSince(previousStart, windowStart),
  ]);

  // What needs doing. Unpaid card orders wait for the customer, not the shop.
  const [needs] = await db
    .select({
      toConfirm: sql<number>`count(*) filter (where ${orders.status} = 'pending' and ${orders.paymentMethod} is distinct from 'paystack')::int`,
      toShip: sql<number>`count(*) filter (where ${orders.status} in ('processing', 'paid'))::int`,
      inTransit: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
      cashOrders: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'cod' and ${orders.paymentStatus} = 'unpaid' and ${orders.status} <> 'cancelled')::int`,
      cashAmount: sql<string>`coalesce(sum(${orders.totalAmount}) filter (where ${orders.paymentMethod} = 'cod' and ${orders.paymentStatus} = 'unpaid' and ${orders.status} <> 'cancelled'), 0)`,
    })
    .from(orders);

  const ordersByStatus = await db.select({ status: orders.status, count: count() }).from(orders).groupBy(orders.status);

  // Revenue per Lagos day for the chart, every day present even with no sales.
  const lagosDay = sql<string>`to_char(${paidMoment} + interval '1 hour', 'YYYY-MM-DD')`;
  const daily = await db
    .select({ date: lagosDay, revenue: sum(orders.totalAmount), orders: count() })
    .from(orders)
    .where(and(isPaid, gte(paidMoment, windowStart.toISOString())))
    .groupBy(lagosDay);
  const byDay = new Map(daily.map((d) => [d.date, d]));
  const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
    const date = lagosDate(new Date(windowStart.getTime() + i * DAY_MS));
    const row = byDay.get(date);
    return { date, revenue: Number(row?.revenue ?? 0), orders: row?.orders ?? 0 };
  });

  const [activeProducts] = await db.select({ n: count() }).from(products).where(eq(products.status, "active"));
  const lowStock = await db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stockQuantity,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(products.status, "active"),
        eq(productVariants.isActive, true),
        lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD)
      )
    )
    .orderBy(asc(productVariants.stockQuantity), asc(products.name))
    .limit(20);

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return {
    timezone: "Africa/Lagos",
    revenue: {
      currency: "NGN",
      total: Number(allTime[0].total ?? 0),
      today: todayRevenue.amount,
      last30Days: last30.amount,
      previous30Days: previous30.amount,
      changePercent: change(last30.amount, previous30.amount),
    },
    orders: {
      total: ordersByStatus.reduce((n, r) => n + r.count, 0),
      byStatus: Object.fromEntries(ordersByStatus.map((r) => [r.status, r.count])),
      last30Days: placed30,
      previous30Days: placedPrevious30,
      changePercent: change(placed30, placedPrevious30),
      toConfirm: needs.toConfirm,
      toShip: needs.toShip,
      inTransit: needs.inTransit,
    },
    cashToCollect: { amount: Number(needs.cashAmount), orders: needs.cashOrders },
    products: { total: activeProducts.n, lowStock, lowStockThreshold: LOW_STOCK_THRESHOLD },
    dailyRevenue,
    recentOrders: recentOrders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
  };
}
