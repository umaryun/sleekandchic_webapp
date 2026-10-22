import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contactMessages, orderItems, orders, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, createProduct, json, signUpCustomer } from "./support/fixtures";
import { GET as listMessages } from "@/app/api/v1/admin/messages/route";
import { PUT as updateMessage } from "@/app/api/v1/admin/messages/[id]/route";
import { GET as getSettings, PUT as saveSettings } from "@/app/api/v1/admin/settings/route";
import { GET as storeSettings } from "@/app/api/v1/store/settings/route";
import { GET as notifications } from "@/app/api/v1/admin/notifications/route";
import { GET as report } from "@/app/api/v1/admin/reports/sales/route";
import { GET as search } from "@/app/api/v1/admin/search/route";
import { GET as activity } from "@/app/api/v1/admin/activity/route";
import { DEFAULT_SETTINGS } from "@/lib/services/settings";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;
let staff: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  staff = await signUpCustomer("staff@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
  await db.update(users).set({ role: "admin" }).where(eq(users.id, staff.userId));
});

const request = (method: string, url: string, who: { headers: Record<string, string> }, body?: unknown) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers: { "content-type": "application/json", ...who.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("messages inbox", () => {
  it("lists new messages first, counts unread and archives", async () => {
    const [first] = await db.insert(contactMessages).values({ name: "Aisha", email: "a@example.com", message: "Size L?" }).returning();
    await db.insert(contactMessages).values({ name: "Musa", email: "m@example.com", message: "Delivery to Kano?" });

    const inbox = await json(await listMessages(request("GET", "/api/v1/admin/messages", staff)));
    expect(inbox.body.data).toMatchObject({ unread: 2 });
    expect(inbox.body.data.messages).toHaveLength(2);

    await updateMessage(request("PUT", `/api/v1/admin/messages/${first.id}`, staff, { status: "archived" }), { params: Promise.resolve({ id: first.id }) });
    const after = await json(await listMessages(request("GET", "/api/v1/admin/messages", staff)));
    expect(after.body.data.messages.map((m: { name: string }) => m.name)).toEqual(["Musa"]);
    expect(after.body.data.unread).toBe(1);
  });
});

describe("settings", () => {
  it("only the owner can change them, and the shop shows the announcement", async () => {
    const settings = { ...DEFAULT_SETTINGS, announcement: { enabled: true, text: "Free delivery in Kaduna this week", link: "/products" } };
    expect((await saveSettings(request("PUT", "/api/v1/admin/settings", staff, settings))).status).toBe(403);
    expect((await saveSettings(request("PUT", "/api/v1/admin/settings", owner, settings))).status).toBe(200);

    const shop = await json(await storeSettings());
    expect(shop.body.data.announcement).toMatchObject({ text: "Free delivery in Kaduna this week", link: "/products" });

    const read = await json(await getSettings(request("GET", "/api/v1/admin/settings", staff)));
    expect(read.body.data.email).toEqual({ provider: null, sender: null, alertsGoTo: ["sleekandchic5@gmail.com"] });
  });

  it("checks alert addresses and links", async () => {
    const bad = {
      ...DEFAULT_SETTINGS,
      announcement: { enabled: true, text: "Sale", link: "https://elsewhere.example" },
      notifications: { ...DEFAULT_SETTINGS.notifications, recipients: ["not-an-email"] },
    };
    const res = await json(await saveSettings(request("PUT", "/api/v1/admin/settings", owner, bad)));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/page on the shop/);
    expect(res.body.error).toMatch(/valid email/);
  });
});

describe("dashboard helpers", () => {
  async function paidOrder(orderNumber: string, total: number, paidAt: Date, state = "Kaduna") {
    const { product } = await createProduct({ name: `Gown ${orderNumber}`, price: total });
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        guestEmail: "aisha@example.com",
        totalAmount: total.toFixed(2),
        paymentMethod: "paystack",
        paymentStatus: "paid",
        paidAt,
        createdAt: paidAt,
        status: "processing",
        shippingMethod: "standard",
        shippingAddress: { ...ADDRESS, state },
      })
      .returning();
    await db.insert(orderItems).values({ orderId: order.id, productId: product.id, name: product.name, price: total.toFixed(2), quantity: 1 });
    return order;
  }

  it("reports sales by day, product and state, compared with the period before", async () => {
    await paidOrder("SC-R-1", 30000, new Date("2026-10-05T10:00:00Z"));
    await paidOrder("SC-R-2", 10000, new Date("2026-10-06T10:00:00Z"), "Kano");
    await paidOrder("SC-R-0", 20000, new Date("2026-09-30T10:00:00Z")); // the week before

    const res = await json(await report(request("GET", "/api/v1/admin/reports/sales?from=2026-10-01&to=2026-10-07", staff)));
    const data = res.body.data;
    expect(data.totals).toMatchObject({ revenue: 40000, orders: 2, averageOrder: 20000, unitsSold: 2 });
    expect(data.previous.revenue).toBe(20000);
    expect(data.changes.revenue).toBe(100);
    expect(data.series).toHaveLength(7);
    expect(data.series.find((d: { date: string }) => d.date === "2026-10-05").revenue).toBe(30000);
    expect(data.topProducts[0]).toMatchObject({ name: "Gown SC-R-1", units: 1, revenue: 30000 });
    expect(data.byState.map((s: { name: string }) => s.name)).toEqual(["Kaduna", "Kano"]);
    expect(data.bySource).toEqual([{ name: "website", orders: 2, revenue: 40000 }]);
  });

  it("counts work waiting and finds orders, products and customers", async () => {
    await paidOrder("SC-N-1", 15000, new Date());
    await db.insert(contactMessages).values({ name: "A", email: "a@example.com", message: "Hello there" });

    const counts = await json(await notifications(request("GET", "/api/v1/admin/notifications", staff)));
    expect(counts.body.data).toMatchObject({ orders: { toShip: 1, toConfirm: 0 }, unreadMessages: 1, latestOrder: { orderNumber: "SC-N-1" } });

    const found = await json(await search(request("GET", "/api/v1/admin/search?q=SC-N", staff)));
    expect(found.body.data.orders[0].orderNumber).toBe("SC-N-1");
    expect(found.body.data.products[0].name).toBe("Gown SC-N-1");
    const byName = await json(await search(request("GET", "/api/v1/admin/search?q=aisha", staff)));
    expect(byName.body.data.customers[0]).toMatchObject({ email: "aisha@example.com" });
  });

  it("shows the activity log to the owner only", async () => {
    expect((await activity(request("GET", "/api/v1/admin/activity", staff))).status).toBe(403);
    expect((await activity(request("GET", "/api/v1/admin/activity", owner))).status).toBe(200);
  });
});
