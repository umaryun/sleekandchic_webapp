import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct } from "./support/fixtures";
import { getOverview, lagosDate, lagosDayStart } from "@/lib/services/analytics";

beforeEach(resetTestDb);

// 1 Oct 2026, 10:00 in Lagos.
const NOW = new Date("2026-10-01T09:00:00Z");
const daysAgo = (n: number, hourUtc = 9) => new Date(Date.UTC(2026, 9, 1 - n, hourUtc));

let seq = 0;
async function order(values: Partial<typeof orders.$inferInsert>) {
  seq += 1;
  await db.insert(orders).values({ orderNumber: `SC-T-${seq}`, totalAmount: "10000.00", createdAt: NOW, ...values });
}

describe("Lagos days", () => {
  it("starts the day at 23:00 UTC", () => {
    expect(lagosDayStart(new Date("2026-10-01T09:00:00Z")).toISOString()).toBe("2026-09-30T23:00:00.000Z");
    expect(lagosDate(new Date("2026-09-30T23:30:00Z"))).toBe("2026-10-01");
    expect(lagosDate(new Date("2026-09-30T22:30:00Z"))).toBe("2026-09-30");
  });
});

describe("dashboard overview", () => {
  it("counts revenue when it was paid, and only what was paid", async () => {
    // Placed 40 days ago, paid yesterday: this month's money.
    await order({ createdAt: daysAgo(40), paidAt: daysAgo(1), paymentStatus: "paid", status: "delivered" });
    // Paid 35 days ago: last period.
    await order({ createdAt: daysAgo(35), paidAt: daysAgo(35), paymentStatus: "paid", totalAmount: "5000.00", status: "delivered" });
    // Paid at 23:30 UTC yesterday, which is today in Lagos.
    await order({ paidAt: new Date("2026-09-30T23:30:00Z"), paymentStatus: "paid", totalAmount: "2500.00", status: "processing" });
    // Not money: refunded, unpaid.
    await order({ paidAt: daysAgo(2), paymentStatus: "refunded", status: "cancelled" });
    await order({ paymentMethod: "cod", paymentStatus: "unpaid", totalAmount: "7000.00" });

    const o = await getOverview(NOW);
    expect(o.revenue).toMatchObject({ today: 2500, last30Days: 12500, previous30Days: 5000, changePercent: 150, total: 17500 });

    expect(o.dailyRevenue).toHaveLength(30);
    expect(o.dailyRevenue[0].date).toBe("2026-09-02");
    expect(o.dailyRevenue.at(-1)).toEqual({ date: "2026-10-01", revenue: 2500, orders: 1 });
    expect(o.dailyRevenue.at(-2)).toEqual({ date: "2026-09-30", revenue: 10000, orders: 1 });
    expect(o.dailyRevenue.filter((d) => d.revenue === 0)).toHaveLength(28);
  });

  it("shows what needs doing and the cash still to collect", async () => {
    await order({ paymentMethod: "cod", status: "pending", totalAmount: "7000.00" });
    await order({ paymentMethod: "cod", status: "shipped", totalAmount: "3000.00" });
    await order({ paymentMethod: "cod", status: "cancelled", totalAmount: "9000.00" });
    await order({ paymentMethod: "paystack", status: "pending" }); // waiting on the customer
    await order({ paymentMethod: "paystack", status: "processing", paymentStatus: "paid", paidAt: NOW });
    await order({ status: "paid", paymentStatus: "paid", paidAt: NOW }); // older order

    const o = await getOverview(NOW);
    expect(o.orders).toMatchObject({ toConfirm: 1, toShip: 2, inTransit: 1, last30Days: 5 });
    expect(o.cashToCollect).toEqual({ amount: 10000, orders: 2 });
  });

  it("lists low stock for products on sale only, emptiest first", async () => {
    await createProduct({ name: "Abaya", price: 20000, variants: [{ size: "M", stock: 4 }, { size: "L", stock: 0 }, { size: "XL", stock: 20 }] });
    const { product: archived } = await createProduct({ name: "Old Bubu", price: 15000, variants: [{ size: "M", stock: 1 }] });
    await db.update(products).set({ status: "archived" }).where(eq(products.id, archived.id));

    const o = await getOverview(NOW);
    expect(o.products.lowStock.map((l) => [l.productName, l.size, l.stock])).toEqual([
      ["Abaya", "L", 0],
      ["Abaya", "M", 4],
    ]);
    expect(o.products.total).toBe(1);
  });
});
