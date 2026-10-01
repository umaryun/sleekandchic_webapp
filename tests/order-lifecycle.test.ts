import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderEvents, orders, products, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, createProduct, json, jsonRequest, seedKadunaRate, signUpCustomer, stockOf } from "./support/fixtures";
import { POST as cartPost, GET as cartGet } from "@/app/api/v1/store/cart/route";
import { POST as checkoutPost } from "@/app/api/v1/store/checkout/route";
import { PUT as updateOrder } from "@/app/api/v1/admin/orders/route";
import * as orderDetailRoute from "@/app/api/v1/admin/orders/[id]/route";
import { DELETE as archiveProduct, PUT as updateProduct } from "@/app/api/v1/admin/products/[id]/route";
import { GET as adminProducts } from "@/app/api/v1/admin/products/route";
import { GET as storeProducts } from "@/app/api/v1/store/products/route";
import { GET as storeProduct } from "@/app/api/v1/store/products/[slug]/route";
import { markOrderPaid } from "@/lib/services/orders";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  await seedKadunaRate();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ name: "Salma", role: "super_admin" }).where(eq(users.id, owner.userId));
});

async function placeOrder(paymentMethod: "cod" | "paystack" = "cod") {
  const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
  const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id, quantity: 2 })));
  if (paymentMethod === "paystack") {
    // Card checkout needs Paystack; place the order directly as unpaid card.
    const [order] = await db
      .insert(orders)
      .values({ orderNumber: "SC-CARD-0001", totalAmount: "20000.00", paymentMethod: "paystack", shippingAddress: ADDRESS })
      .returning();
    return { order, variantId: variants[0].id, product };
  }
  await checkoutPost(
    jsonRequest(
      "/api/v1/store/checkout",
      { guestEmail: "aisha@example.com", shippingAddress: ADDRESS, shippingMethod: "standard", paymentMethod: "cod" },
      { "x-guest-token": added.body.data.guestToken }
    )
  );
  const [order] = await db.select().from(orders);
  return { order, variantId: variants[0].id, product };
}

// jsonRequest builds a POST; the handler doesn't look at the method.
const update = async (body: Record<string, unknown>) =>
  json(await updateOrder(jsonRequest("/api/v1/admin/orders", body, owner.headers)));

const detail = async (id: string) =>
  json(await orderDetailRoute.GET(jsonRequest(`/api/v1/admin/orders/${id}`, undefined, owner.headers), { params: Promise.resolve({ id }) }));

describe("order status rules", () => {
  it("moves forward, records who did what, and offers only valid next steps", async () => {
    const { order } = await placeOrder();
    expect((await detail(order.id)).body.data.allowedStatuses).toEqual(["processing", "shipped", "delivered", "cancelled"]);

    expect((await update({ orderId: order.id, status: "shipped", note: "GIG Logistics" })).status).toBe(200);
    const back = await update({ orderId: order.id, status: "processing" });
    expect(back.status).toBe(409);
    expect(back.body.error).toMatch(/can't go back from Shipped to Preparing/);

    await update({ orderId: order.id, status: "delivered", paymentStatus: "paid" });
    expect((await update({ orderId: order.id, status: "cancelled" })).status).toBe(409);

    const { body } = await detail(order.id);
    expect(body.data.allowedStatuses).toEqual([]);
    expect(body.data.timeline.map((e: { type: string }) => e.type)).toEqual([
      "placed",
      "status_changed",
      "payment_status_changed",
      "status_changed",
    ]);
    expect(body.data.timeline[1]).toMatchObject({ fromStatus: "pending", toStatus: "shipped", message: "GIG Logistics", actorName: "Salma" });
  });

  it("holds an unpaid card order until it's paid, then moves it to preparing", async () => {
    const { order } = await placeOrder("paystack");
    const early = await update({ orderId: order.id, status: "processing" });
    expect(early.status).toBe(409);
    expect(early.body.error).toMatch(/hasn't been paid yet/);
    expect((await detail(order.id)).body.data.allowedStatuses).toEqual(["cancelled"]);

    await db.transaction((tx) => markOrderPaid(tx, order.id, { reference: "SC-CARD-0001-X", transactionId: 1 }));
    const [paid] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(paid).toMatchObject({ status: "processing", paymentStatus: "paid" });
    const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id));
    expect(events.map((e) => e.type)).toEqual(["payment_received"]);
  });

  it("cancelling returns stock and notes the reason on the timeline", async () => {
    const { order, variantId } = await placeOrder();
    expect(await stockOf(variantId)).toBe(3);
    await update({ orderId: order.id, status: "cancelled", note: "Customer changed address, reordering" });
    expect(await stockOf(variantId)).toBe(5);
    const cancelled = (await detail(order.id)).body.data.timeline.at(-1);
    expect(cancelled).toMatchObject({ type: "cancelled", toStatus: "cancelled", message: "Customer changed address, reordering" });
  });

  it("keeps notes without changing anything else", async () => {
    const { order } = await placeOrder();
    await update({ orderId: order.id, note: "Deliver after 5pm" });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(row.status).toBe("pending");
    expect((await detail(order.id)).body.data.timeline.at(-1)).toMatchObject({ type: "note", message: "Deliver after 5pm" });
  });

  it("has no way to delete an order", () => {
    expect("DELETE" in orderDetailRoute).toBe(false);
  });
});

describe("archiving products", () => {
  it("hides an archived product from the shop and bags but keeps it restorable", async () => {
    const { product, variants } = await createProduct({ name: "Silk Bubu", price: 20000, variants: [{ size: "M", stock: 5 }] });
    const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id })));

    const params = { params: Promise.resolve({ id: product.id }) };
    const archived = await json(
      await archiveProduct(new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, { method: "DELETE", headers: owner.headers }), params)
    );
    expect(archived.body.data).toEqual({ archived: true });
    expect(await db.select().from(products)).toHaveLength(1);

    const shop = await json(await storeProducts(jsonRequest("/api/v1/store/products")));
    expect(shop.body.data.products).toHaveLength(0);
    expect((await storeProduct(jsonRequest(`/api/v1/store/products/${product.slug}`), { params: Promise.resolve({ slug: product.slug }) })).status).toBe(404);
    const bag = await json(await cartGet(jsonRequest("/api/v1/store/cart", undefined, { "x-guest-token": added.body.data.guestToken })));
    expect(bag.body.data.items[0].problem).toMatch(/Silk Bubu is no longer available/);

    const adminList = await json(await adminProducts(jsonRequest("/api/v1/admin/products", undefined, owner.headers)));
    expect(adminList.body.data.products).toHaveLength(0);
    const archivedList = await json(await adminProducts(jsonRequest("/api/v1/admin/products?status=archived", undefined, owner.headers)));
    expect(archivedList.body.data.products).toHaveLength(1);

    await updateProduct(
      new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json", ...owner.headers },
        body: JSON.stringify({ status: "active" }),
      }),
      { params: Promise.resolve({ id: product.id }) }
    );
    const restored = await json(await storeProducts(jsonRequest("/api/v1/store/products")));
    expect(restored.body.data.products).toHaveLength(1);
  });
});
