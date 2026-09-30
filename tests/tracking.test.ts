import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, json, jsonRequest } from "./support/fixtures";
import { GET as trackGet } from "@/app/api/v1/store/orders/tracking/route";

const track = async (query: Record<string, string>) =>
  json(await trackGet(jsonRequest(`/api/v1/store/orders/tracking?${new URLSearchParams(query)}`)));

beforeEach(async () => {
  await resetTestDb();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: "SC-TRACK-0001",
      guestEmail: "Aisha@Example.com",
      totalAmount: "21500.00",
      subtotal: "20000.00",
      shippingFee: "1500.00",
      status: "shipped",
      paymentStatus: "paid",
      paymentMethod: "paystack",
      shippingMethod: "standard",
      shippingAddress: ADDRESS, // phone +2348030000000
    })
    .returning();
  await db.insert(orderItems).values({ orderId: order.id, name: "Emerald Abaya", price: "20000.00", quantity: 1, size: "M", color: "Green" });
});

describe("order tracking", () => {
  it("finds an order by email, ignoring case", async () => {
    const res = await track({ order_number: "sc-track-0001", contact: "aisha@example.COM" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ orderNumber: "SC-TRACK-0001", status: "shipped", deliveryCity: "Kaduna" });
    expect(res.body.data.items[0]).toMatchObject({ name: "Emerald Abaya", size: "M" });
    // Only city and state are returned, never the street or phone.
    expect(JSON.stringify(res.body.data)).not.toContain("Ahmadu Bello");
    expect(JSON.stringify(res.body.data)).not.toContain("8030000000");
  });

  it("finds an order by phone in local or international format", async () => {
    expect((await track({ order_number: "SC-TRACK-0001", contact: "0803 000 0000" })).status).toBe(200);
    expect((await track({ order_number: "SC-TRACK-0001", contact: "+234 803 000 0000" })).status).toBe(200);
  });

  it("gives the same answer for a wrong contact and a missing order", async () => {
    const wrong = await track({ order_number: "SC-TRACK-0001", contact: "someone@else.com" });
    const missing = await track({ order_number: "SC-NOPE-0000", contact: "aisha@example.com" });
    const none = await track({ order_number: "SC-TRACK-0001" });
    expect([wrong.status, missing.status, none.status]).toEqual([404, 404, 404]);
    expect(wrong.body.error).toBe(missing.body.error);
  });
});
