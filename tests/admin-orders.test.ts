import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { GET as listOrders } from "@/app/api/v1/admin/orders/route";
import { GET as getOrder } from "@/app/api/v1/admin/orders/[id]/route";

let admin: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  admin = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, admin.userId));
  await db.insert(orders).values([
    {
      orderNumber: "SC-AAAA-0001",
      guestEmail: "aisha@example.com",
      totalAmount: "21500.00",
      subtotal: "20000.00",
      shippingFee: "1500.00",
      paymentMethod: "cod",
      shippingMethod: "express",
      shippingAddress: ADDRESS, // Aisha Bello, +2348030000000
    },
    {
      orderNumber: "SC-BBBB-0002",
      guestEmail: "musa@example.com",
      totalAmount: "9000.00",
      paymentMethod: "paystack",
      shippingMethod: "standard",
      shippingAddress: { ...ADDRESS, firstName: "Musa", lastName: "Ibrahim", phone: "0705 111 2222" },
    },
  ]);
});

const search = async (q: string) => {
  const res = await json(await listOrders(jsonRequest(`/api/v1/admin/orders?search=${encodeURIComponent(q)}`, undefined, admin.headers)));
  return res.body.data.orders.map((o: { orderNumber: string }) => o.orderNumber);
};

describe("admin orders", () => {
  it("shows who to deliver to, their phone, and how they pay", async () => {
    const res = await json(await listOrders(jsonRequest("/api/v1/admin/orders", undefined, admin.headers)));
    const first = res.body.data.orders.find((o: { orderNumber: string }) => o.orderNumber === "SC-AAAA-0001");
    expect(first).toMatchObject({
      customerName: "Aisha Bello",
      customerPhone: "+2348030000000",
      customerEmail: "aisha@example.com",
      paymentMethod: "cod",
      shippingMethod: "express",
      deliveryState: "Kaduna",
    });
  });

  it("finds orders by number, email, name or phone in any format", async () => {
    expect(await search("AAAA")).toEqual(["SC-AAAA-0001"]);
    expect(await search("musa@")).toEqual(["SC-BBBB-0002"]);
    expect(await search("aisha bello")).toEqual(["SC-AAAA-0001"]);
    expect(await search("0803 000 0000")).toEqual(["SC-AAAA-0001"]);
    expect(await search("+234 705 111 2222")).toEqual(["SC-BBBB-0002"]);
  });

  it("returns the price breakdown on the order detail", async () => {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, "SC-AAAA-0001"));
    const res = await json(await getOrder(jsonRequest(`/api/v1/admin/orders/${order.id}`, undefined, admin.headers), { params: Promise.resolve({ id: order.id }) }));
    expect(res.body.data).toMatchObject({ subtotal: 20000, shippingFee: 1500, totalAmount: 21500, customerPhone: "+2348030000000", customerName: "Aisha Bello" });
  });

  it("refuses customers", async () => {
    const customer = await signUpCustomer();
    expect((await listOrders(jsonRequest("/api/v1/admin/orders", undefined, customer.headers))).status).toBe(403);
  });
});
