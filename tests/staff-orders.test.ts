import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orderEvents, orders, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, createProduct, json, jsonRequest, signUpCustomer, stockOf } from "./support/fixtures";
import { GET as listOrders, POST as recordSale, PUT as updateOrder } from "@/app/api/v1/admin/orders/route";
import { POST as bulkUpdate } from "@/app/api/v1/admin/orders/bulk/route";
import { GET as getCustomer } from "@/app/api/v1/admin/customers/[id]/route";
import { GET as listCustomers } from "@/app/api/v1/admin/customers/route";

let staff: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  staff = await signUpCustomer("staff@example.com");
  await db.update(users).set({ role: "admin" }).where(eq(users.id, staff.userId));
});

const put = (url: string, body: unknown) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...staff.headers },
    body: JSON.stringify(body),
  });

async function record(body: Record<string, unknown>) {
  return json(await recordSale(jsonRequest("/api/v1/admin/orders", body, staff.headers)));
}

const sale = (productId: string, variantId: string, extra: Record<string, unknown> = {}) => ({
  source: "whatsapp",
  items: [{ productId, variantId, quantity: 2 }],
  customer: { firstName: "Hauwa", lastName: "Musa", phone: "0803 111 2222" },
  shippingMethod: "standard",
  address: { street: "4 Sultan Road", city: "Kano", state: "Kano" },
  deliveryFee: 2500,
  paymentMethod: "transfer",
  paid: true,
  ...extra,
});

describe("recording a sale made off the website", () => {
  it("takes stock, totals the order and marks where it came from", async () => {
    const { product, variants } = await createProduct({ name: "Ivory Kaftan", price: 30000, variants: [{ stock: 5 }] });
    const res = await record(sale(product.id, variants[0].id, { discountAmount: 5000 }));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ source: "whatsapp", status: "processing", paymentStatus: "paid", paymentMethod: "transfer", totalAmount: 57500 });
    expect(await stockOf(variants[0].id)).toBe(3);

    const [placed] = await db.select().from(orderEvents).where(eq(orderEvents.orderId, res.body.data.id));
    expect(placed.message).toMatch(/Recorded by staff · WhatsApp · Paid/);
  });

  it("uses the agreed price when staff enter one", async () => {
    const { product, variants } = await createProduct({ price: 30000, variants: [{ stock: 5 }] });
    const res = await record({ ...sale(product.id, variants[0].id), items: [{ productId: product.id, variantId: variants[0].id, quantity: 1, unitPrice: 27000 }], deliveryFee: 0 });
    expect(res.body.data.totalAmount).toBe(27000);
  });

  it("refuses more than is in stock", async () => {
    const { product, variants } = await createProduct({ price: 30000, variants: [{ stock: 1 }] });
    const res = await record(sale(product.id, variants[0].id));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Only 1 left/);
    expect(await stockOf(variants[0].id)).toBe(1);
  });

  it("finishes a paid walk-in sale the customer took with them", async () => {
    const { product, variants } = await createProduct({ price: 30000, variants: [{ stock: 3 }] });
    const res = await record({
      ...sale(product.id, variants[0].id),
      source: "in_store",
      shippingMethod: "pickup",
      address: undefined,
      paymentMethod: "pos",
      handedOver: true,
    });
    expect(res.body.data).toMatchObject({ status: "delivered", shippingMethod: "pickup", shippingFee: "0.00", totalAmount: 60000 });
  });

  it("needs an address for delivery", async () => {
    const { product, variants } = await createProduct({ price: 30000, variants: [{ stock: 3 }] });
    const res = await record({ ...sale(product.id, variants[0].id), address: { street: "", city: "", state: "" } });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/delivery address/);
  });

  it("lists phone-only customers and finds their orders", async () => {
    const { product, variants } = await createProduct({ price: 10000, variants: [{ stock: 9 }] });
    await record(sale(product.id, variants[0].id));
    await record({ ...sale(product.id, variants[0].id), customer: { firstName: "Hauwa", lastName: "Musa", phone: "+234 803 111 2222" } });

    const list = await json(await listCustomers(jsonRequest("/api/v1/admin/customers", undefined, staff.headers)));
    const hauwa = list.body.data.customers.find((c: { name: string }) => c.name === "Hauwa Musa");
    expect(hauwa).toMatchObject({ id: "p:8031112222", type: "guest", totalOrders: 2 });

    const profile = await json(await getCustomer(jsonRequest(`/api/v1/admin/customers/${encodeURIComponent(hauwa.id)}`, undefined, staff.headers), { params: Promise.resolve({ id: encodeURIComponent(hauwa.id) }) }));
    expect(profile.body.data.orders).toHaveLength(2);
    expect(profile.body.data.topItems[0].quantity).toBe(4);
    expect(profile.body.data.deliveredTo[0]).toMatchObject({ street: "4 Sultan Road", state: "Kano" });
  });
});

describe("staff order updates", () => {
  async function paidOrder(number: string, status: "processing" | "pending" = "processing", paymentMethod: "paystack" | "transfer" = "paystack") {
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: number,
        guestEmail: "aisha@example.com",
        totalAmount: "20000.00",
        paymentMethod,
        paymentStatus: status === "pending" ? "unpaid" : "paid",
        status,
        shippingMethod: "express",
        shippingAddress: ADDRESS,
      })
      .returning();
    return order;
  }

  it("records the GIG waybill on the timeline and shows it in the list", async () => {
    const order = await paidOrder("SC-T-1");
    const res = await json(await updateOrder(put("/api/v1/admin/orders", { orderId: order.id, status: "shipped", trackingNumber: "GIG 123456" })));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "shipped", trackingNumber: "GIG 123456" });
    const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id));
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["tracking_updated", "status_changed"]));

    const list = await json(await listOrders(jsonRequest("/api/v1/admin/orders?search=123456", undefined, staff.headers)));
    expect(list.body.data.orders.map((o: { orderNumber: string }) => o.orderNumber)).toEqual(["SC-T-1"]);
  });

  it("moves several orders at once and explains the ones it can't", async () => {
    const a = await paidOrder("SC-B-1");
    const b = await paidOrder("SC-B-2");
    const unpaid = await paidOrder("SC-B-3", "pending");
    const res = await json(await bulkUpdate(jsonRequest("/api/v1/admin/orders/bulk", { orderIds: [a.id, b.id, unpaid.id], status: "shipped" }, staff.headers)));
    expect(res.body.data.updated.map((o: { orderNumber: string }) => o.orderNumber).sort()).toEqual(["SC-B-1", "SC-B-2"]);
    expect(res.body.data.skipped).toEqual([expect.objectContaining({ id: unpaid.id, reason: expect.stringMatching(/hasn't been paid/) })]);
  });

  it("counts orders per status for the tabs, with the other filters applied", async () => {
    await paidOrder("SC-C-1");
    await paidOrder("SC-C-2", "pending");
    await paidOrder("SC-C-3", "processing", "transfer");
    const res = await json(await listOrders(jsonRequest("/api/v1/admin/orders?status=processing&paymentStatus=paid", undefined, staff.headers)));
    expect(res.body.data.counts).toMatchObject({ all: 2, processing: 2, pending: 0 });
    expect(res.body.data.orders[0]).toMatchObject({ itemCount: 0, customerId: "g:aisha@example.com" });
  });
});
