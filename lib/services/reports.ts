import { and, count, desc, eq, gte, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, orderItems, orders, products, users } from "@/lib/db/schema";
import { lagosDate } from "@/lib/services/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight in Lagos at the start of a YYYY-MM-DD day. */
export const lagosMidnight = (day: string) => new Date(`${day}T00:00:00+01:00`);

// Sales are counted when the money came in (orders paid before paidAt was
// recorded fall back to when they were placed), so a report matches the bank.
const paidMoment = sql`coalesce(${orders.paidAt}, ${orders.createdAt})`;

function paidBetween(from: Date, to: Date) {
  return and(
    eq(orders.paymentStatus, "paid"),
    gte(paidMoment, from.toISOString()),
    lt(paidMoment, to.toISOString())
  );
}

async function totals(from: Date, to: Date) {
  const [row] = await db
    .select({
      revenue: sum(orders.totalAmount),
      orders: count(),
      discounts: sum(orders.discountAmount),
      delivery: sum(orders.shippingFee),
    })
    .from(orders)
    .where(paidBetween(from, to));
  const [items] = await db
    .select({ units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(paidBetween(from, to));
  const [customers] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "customer"), gte(users.createdAt, from), lt(users.createdAt, to)));
  const [cancelled] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.status, "cancelled"), gte(orders.createdAt, from), lt(orders.createdAt, to)));
  const [refunded] = await db
    .select({ n: count(), amount: sum(orders.totalAmount) })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "refunded"), gte(orders.updatedAt, from), lt(orders.updatedAt, to)));

  const revenue = Number(row.revenue ?? 0);
  return {
    revenue,
    orders: row.orders,
    averageOrder: row.orders ? Math.round(revenue / row.orders) : 0,
    unitsSold: items.units,
    discounts: Number(row.discounts ?? 0),
    deliveryFees: Number(row.delivery ?? 0),
    newCustomers: customers.n,
    cancelledOrders: cancelled.n,
    refunds: { orders: refunded.n, amount: Number(refunded.amount ?? 0) },
  };
}

/** Percentage change, or null when there's nothing to compare with. */
const change = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

/**
 * Sales between two Lagos days (both included), compared with the same
 * number of days just before.
 */
export async function salesReport(fromDay: string, toDay: string) {
  const from = lagosMidnight(fromDay);
  const to = new Date(lagosMidnight(toDay).getTime() + DAY_MS);
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  const previousFrom = new Date(from.getTime() - days * DAY_MS);

  const [current, previous] = await Promise.all([totals(from, to), totals(previousFrom, from)]);
  const where = paidBetween(from, to);

  const lagosDay = sql<string>`to_char(${paidMoment} + interval '1 hour', 'YYYY-MM-DD')`;
  const daily = await db
    .select({ date: lagosDay, revenue: sum(orders.totalAmount), orders: count() })
    .from(orders)
    .where(where)
    .groupBy(lagosDay);
  const byDay = new Map(daily.map((d) => [d.date, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const date = lagosDate(new Date(from.getTime() + i * DAY_MS));
    const row = byDay.get(date);
    return { date, revenue: Number(row?.revenue ?? 0), orders: row?.orders ?? 0 };
  });

  const lineRevenue = sql<string>`sum(${orderItems.price} * ${orderItems.quantity})`;
  const [topProducts, byCategory, byState, byMethod, byPayment, bySource, promoCodes] = await Promise.all([
    db
      .select({
        productId: orderItems.productId,
        name: sql<string>`max(${orderItems.name})`,
        units: sql<number>`sum(${orderItems.quantity})::int`,
        revenue: lineRevenue,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orderItems.productId)
      .orderBy(desc(lineRevenue))
      .limit(10),
    db
      .select({
        name: sql<string>`coalesce(${categories.name}, 'No category')`,
        units: sql<number>`sum(${orderItems.quantity})::int`,
        revenue: lineRevenue,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .groupBy(sql`coalesce(${categories.name}, 'No category')`)
      .orderBy(desc(lineRevenue)),
    db
      .select({
        name: sql<string>`coalesce(nullif(${orders.shippingAddress}->>'state', ''), 'Not given')`,
        orders: count(),
        revenue: sum(orders.totalAmount),
      })
      .from(orders)
      .where(where)
      .groupBy(sql`coalesce(nullif(${orders.shippingAddress}->>'state', ''), 'Not given')`)
      .orderBy(desc(sum(orders.totalAmount)))
      .limit(12),
    db
      .select({ name: orders.shippingMethod, orders: count(), revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(where)
      .groupBy(orders.shippingMethod),
    db
      .select({ name: orders.paymentMethod, orders: count(), revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(where)
      .groupBy(orders.paymentMethod),
    db
      .select({ name: orders.source, orders: count(), revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(where)
      .groupBy(orders.source),
    db
      .select({
        code: orders.discountCode,
        orders: count(),
        discount: sum(orders.discountAmount),
        revenue: sum(orders.totalAmount),
      })
      .from(orders)
      .where(and(where, isNotNull(orders.discountCode), ne(orders.discountCode, "")))
      .groupBy(orders.discountCode)
      .orderBy(desc(count())),
  ]);

  const group = (rows: { name: string | null; orders: number; revenue: string | null }[]) =>
    rows
      .map((r) => ({ name: r.name ?? "not_recorded", orders: r.orders, revenue: Number(r.revenue ?? 0) }))
      .sort((a, b) => b.revenue - a.revenue);

  return {
    range: { from: fromDay, to: toDay, days, timezone: "Africa/Lagos" },
    totals: current,
    previous,
    changes: {
      revenue: change(current.revenue, previous.revenue),
      orders: change(current.orders, previous.orders),
      averageOrder: change(current.averageOrder, previous.averageOrder),
      unitsSold: change(current.unitsSold, previous.unitsSold),
    },
    series,
    topProducts: topProducts.map((p) => ({ ...p, revenue: Number(p.revenue ?? 0) })),
    byCategory: byCategory.map((c) => ({ ...c, revenue: Number(c.revenue ?? 0) })),
    byState: group(byState),
    byShippingMethod: group(byMethod),
    byPaymentMethod: group(byPayment),
    bySource: group(bySource),
    promoCodes: promoCodes.map((p) => ({
      code: p.code!,
      orders: p.orders,
      discount: Number(p.discount ?? 0),
      revenue: Number(p.revenue ?? 0),
    })),
  };
}
