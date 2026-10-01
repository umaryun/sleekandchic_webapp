import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, discounts, orders, paymentEvents, products, stockMovements } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import {
  ADDRESS,
  createDiscount,
  createProduct,
  json,
  jsonRequest,
  seedKadunaRate,
  signPaystack,
  stockOf,
} from "./support/fixtures";
import { POST as cartPost, GET as cartGet } from "@/app/api/v1/store/cart/route";
import { POST as quotePost } from "@/app/api/v1/store/checkout/quote/route";
import { POST as checkoutPost } from "@/app/api/v1/store/checkout/route";
import { GET as verifyGet } from "@/app/api/v1/store/checkout/verify/route";
import { POST as payPost } from "@/app/api/v1/store/checkout/pay/route";
import { POST as webhookPost } from "@/app/api/v1/store/webhooks/payment/route";
import { cancelOrder, expireStaleOrders } from "@/lib/services/orders";

// ── helpers ─────────────────────────────────────────────

async function addToBag(productId: string, variantId?: string, quantity = 1, guestToken?: string) {
  const res = await cartPost(
    jsonRequest("/api/v1/store/cart", { action: "add", productId, variantId, quantity }, guestToken ? { "x-guest-token": guestToken } : {})
  );
  return json(res);
}

async function checkout(guestToken: string, overrides: Record<string, unknown> = {}) {
  return json(
    await checkoutPost(
      jsonRequest(
        "/api/v1/store/checkout",
        {
          guestEmail: "aisha@example.com",
          shippingAddress: ADDRESS,
          shippingMethod: "standard",
          paymentMethod: "cod",
          ...overrides,
        },
        { "x-guest-token": guestToken }
      )
    )
  );
}

function paystackFetch(handlers: { initialize?: () => Response; verify?: () => Response }) {
  return vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.includes("/transaction/initialize") && handlers.initialize) return handlers.initialize();
    if (u.includes("/transaction/verify/") && handlers.verify) return handlers.verify();
    throw new Error(`Unexpected fetch ${u}`);
  });
}

const okInit = () =>
  Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "abc", reference: "REF" } });

async function webhook(event: unknown, signature?: string) {
  const body = JSON.stringify(event);
  const { NextRequest } = await import("next/server");
  return webhookPost(
    new NextRequest("http://localhost:3000/api/v1/store/webhooks/payment", {
      method: "POST",
      body,
      headers: { "x-paystack-signature": signature ?? signPaystack(body) },
    })
  );
}

beforeEach(async () => {
  await resetTestDb();
  await seedKadunaRate();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── C3: prices and variants come from the catalogue ──────

describe("bag", () => {
  it("rejects a variant that belongs to another product", async () => {
    const expensive = await createProduct({ price: 90000, variants: [{ stock: 5 }] });
    const cheap = await createProduct({ price: 1000, variants: [{ stock: 5, priceOverride: 500 }] });
    const res = await addToBag(expensive.product.id, cheap.variants[0].id);
    expect(res.status).toBe(400);
  });

  it("requires a size when the product has sizes", async () => {
    const { product } = await createProduct({ price: 20000, variants: [{ stock: 3 }] });
    const res = await addToBag(product.id);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Choose a size/);
  });

  it("won't add more than is in stock", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 2 }] });
    const first = await addToBag(product.id, variants[0].id, 2);
    expect(first.status).toBe(200);
    const again = await addToBag(product.id, variants[0].id, 1, first.body.data.guestToken);
    expect(again.status).toBe(409);
    expect(again.body.error).toMatch(/Only 2 left/);
  });

  it("shows the current catalogue price, not the price when added", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 3 }] });
    const added = await addToBag(product.id, variants[0].id);
    await db.update(products).set({ price: "25000.00" }).where(eq(products.id, product.id));
    const res = await json(await cartGet(jsonRequest("/api/v1/store/cart", undefined, { "x-guest-token": added.body.data.guestToken })));
    expect(res.body.data.items[0].unitPrice).toBe(25000);
    expect(res.body.data.subtotal).toBe(25000);
  });
});

// ── C5/C6: the quote is the only source of totals ─────────

describe("quote", () => {
  it("prices subtotal, promo code and delivery with no VAT", async () => {
    const { product, variants } = await createProduct({ price: 10000, variants: [{ stock: 5 }] });
    const added = await addToBag(product.id, variants[0].id, 2);
    await createDiscount({ code: "EID10", discountType: "percentage", value: "10" });

    const res = await json(
      await quotePost(
        jsonRequest("/api/v1/store/checkout/quote", { state: "Kaduna", shippingMethod: "standard", discountCode: "eid10" }, { "x-guest-token": added.body.data.guestToken })
      )
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      subtotal: 20000,
      discountAmount: 2000,
      shippingFee: 1500,
      totalAmount: 19500,
      discountCode: "EID10",
      discountError: null,
    });
  });

  it("explains an invalid promo code instead of failing", async () => {
    const { product, variants } = await createProduct({ price: 10000, variants: [{ stock: 5 }] });
    const added = await addToBag(product.id, variants[0].id);
    const res = await json(
      await quotePost(jsonRequest("/api/v1/store/checkout/quote", { state: "Kaduna", discountCode: "SAVE10" }, { "x-guest-token": added.body.data.guestToken }))
    );
    expect(res.status).toBe(200);
    expect(res.body.data.discountError).toMatch(/SAVE10 isn't valid/);
    expect(res.body.data.totalAmount).toBe(11500);
  });
});

// ── C3/C4/C9: placing an order ────────────────────────────

describe("pay on delivery", () => {
  it("charges catalogue prices, takes stock, uses the code and clears the bag", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 5 }] });
    const added = await addToBag(product.id, variants[0].id, 2);
    const token = added.body.data.guestToken;
    await db.update(products).set({ price: "21000.00" }).where(eq(products.id, product.id));
    const code = await createDiscount({ code: "WELCOME", discountType: "fixed_amount", value: "1000", maxUses: 5 });

    const res = await checkout(token, { discountCode: "welcome" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ subtotal: 42000, discountAmount: 1000, shippingFee: 0, totalAmount: 41000, paymentMethod: "cod" });

    const [order] = await db.select().from(orders);
    expect(order).toMatchObject({ paymentMethod: "cod", shippingMethod: "standard", totalAmount: "41000.00", subtotal: "42000.00", discountCode: "WELCOME" });
    expect(await stockOf(variants[0].id)).toBe(3);
    const moves = await db.select().from(stockMovements);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ delta: -2, reason: "order", orderId: order.id });
    const [d] = await db.select().from(discounts).where(eq(discounts.id, code.id));
    expect(d.usedCount).toBe(1);
    expect(await db.select().from(cartItems)).toHaveLength(0);
  });

  it("refuses when stock ran out after adding to the bag and leaves nothing behind", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 2 }] });
    const added = await addToBag(product.id, variants[0].id, 2);
    await createDiscount({ code: "WELCOME", maxUses: 5 });
    // Someone else bought one meanwhile.
    const { productVariants } = await import("@/lib/db/schema");
    await db.update(productVariants).set({ stockQuantity: 1 }).where(eq(productVariants.id, variants[0].id));

    const res = await checkout(added.body.data.guestToken, { discountCode: "WELCOME" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Only 1 left/);
    expect(await db.select().from(orders)).toHaveLength(0);
    expect(await stockOf(variants[0].id)).toBe(1);
    const [d] = await db.select().from(discounts);
    expect(d.usedCount).toBe(0);
  });

  it("stops a promo code at its limit", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 10 }] });
    await createDiscount({ code: "ONCE", maxUses: 1 });
    const a = await addToBag(product.id, variants[0].id);
    expect((await checkout(a.body.data.guestToken, { discountCode: "ONCE" })).status).toBe(200);
    const b = await addToBag(product.id, variants[0].id);
    const second = await checkout(b.body.data.guestToken, { discountCode: "ONCE" });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/fully used/);
  });
});

// ── C8: card payments ─────────────────────────────────────

describe("card payment", () => {
  async function cardOrder(stock = 5, qty = 1) {
    const { product, variants } = await createProduct({ price: 15000, variants: [{ stock }] });
    const added = await addToBag(product.id, variants[0].id, qty);
    const token = added.body.data.guestToken;
    vi.stubGlobal("fetch", paystackFetch({ initialize: okInit }));
    const res = await checkout(token, { paymentMethod: "paystack" });
    const [order] = await db.select().from(orders);
    return { res, order, token, variantId: variants[0].id };
  }

  it("keeps the bag and holds stock until payment succeeds", async () => {
    const { res, order, variantId } = await cardOrder();
    expect(res.status).toBe(200);
    expect(res.body.data.payment.authorization_url).toBe("https://checkout.paystack.com/abc");
    expect(order).toMatchObject({ paymentMethod: "paystack", paymentStatus: "unpaid", status: "pending", paymentReference: "REF" });
    expect(order.expiresAt).not.toBeNull();
    expect(await db.select().from(cartItems)).toHaveLength(1);
    expect(await stockOf(variantId)).toBe(4);
  });

  it("never turns a failed card payment into pay on delivery", async () => {
    const { product, variants } = await createProduct({ price: 15000, variants: [{ stock: 5 }] });
    const added = await addToBag(product.id, variants[0].id);
    vi.stubGlobal("fetch", paystackFetch({ initialize: () => Response.json({ status: false, message: "down" }, { status: 500 }) }));
    const res = await checkout(added.body.data.guestToken, { paymentMethod: "paystack" });
    expect(res.status).toBe(502);
    expect(res.body.data.canRetryPayment).toBe(true);
    const [order] = await db.select().from(orders);
    expect(order).toMatchObject({ paymentMethod: "paystack", paymentStatus: "unpaid", status: "pending" });
  });

  it("refuses card checkout when Paystack isn't configured", async () => {
    const { env } = await import("@/lib/env");
    const saved = env.PAYSTACK_SECRET_KEY;
    env.PAYSTACK_SECRET_KEY = undefined;
    try {
      const { product, variants } = await createProduct({ price: 15000, variants: [{ stock: 5 }] });
      const added = await addToBag(product.id, variants[0].id);
      const res = await checkout(added.body.data.guestToken, { paymentMethod: "paystack" });
      expect(res.status).toBe(503);
      expect(await db.select().from(orders)).toHaveLength(0);
    } finally {
      env.PAYSTACK_SECRET_KEY = saved;
    }
  });

  it("marks the order paid from the webhook exactly once", async () => {
    const { order, variantId } = await cardOrder();
    const event = { event: "charge.success", data: { id: 777, reference: "REF", amount: 1650000, currency: "NGN", metadata: { orderId: order.id } } };

    expect((await webhook(event)).status).toBe(200);
    expect((await webhook(event)).status).toBe(200); // Paystack retry

    const [paid] = await db.select().from(orders);
    expect(paid).toMatchObject({ paymentStatus: "paid", status: "processing" });
    expect(paid.paidAt).not.toBeNull();
    expect(await db.select().from(paymentEvents)).toHaveLength(1);
    expect(await stockOf(variantId)).toBe(4);
    expect(await db.select().from(cartItems)).toHaveLength(0);
  });

  it("rejects a forged webhook and ignores a wrong amount", async () => {
    const { order } = await cardOrder();
    const event = { event: "charge.success", data: { id: 1, reference: "REF", amount: 100, currency: "NGN", metadata: { orderId: order.id } } };
    expect((await webhook(event, "deadbeef")).status).toBe(401);
    expect((await webhook(event)).status).toBe(200);
    const [unpaid] = await db.select().from(orders);
    expect(unpaid.paymentStatus).toBe("unpaid");
  });

  it("confirms payment on the return page by asking Paystack", async () => {
    const { order } = await cardOrder();
    vi.stubGlobal(
      "fetch",
      paystackFetch({
        verify: () => Response.json({ status: true, data: { id: 9, status: "success", reference: "REF", amount: 1650000, currency: "NGN", paid_at: null, metadata: { orderId: order.id } } }),
      })
    );
    const res = await json(await verifyGet(jsonRequest("/api/v1/store/checkout/verify?reference=REF")));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "paid", orderNumber: order.orderNumber, totalAmount: 16500 });
  });

  it("lets the customer retry payment on the same order", async () => {
    const { order } = await cardOrder();
    vi.stubGlobal("fetch", paystackFetch({ initialize: () => Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/retry", access_code: "x", reference: "REF2" } }) }));
    const res = await json(await payPost(jsonRequest("/api/v1/store/checkout/pay", { orderNumber: order.orderNumber, email: "AISHA@example.com" })));
    expect(res.status).toBe(200);
    expect(res.body.data.payment.authorization_url).toBe("https://checkout.paystack.com/retry");
    const wrong = await json(await payPost(jsonRequest("/api/v1/store/checkout/pay", { orderNumber: order.orderNumber, email: "someone@else.com" })));
    expect(wrong.status).toBe(404);
  });

  it("releases stock and the promo code when an unpaid card order expires", async () => {
    const { product, variants } = await createProduct({ price: 15000, variants: [{ stock: 5 }] });
    const added = await addToBag(product.id, variants[0].id, 2);
    await createDiscount({ code: "EID10", maxUses: 3 });
    vi.stubGlobal("fetch", paystackFetch({ initialize: okInit }));
    await checkout(added.body.data.guestToken, { paymentMethod: "paystack", discountCode: "EID10" });
    expect(await stockOf(variants[0].id)).toBe(3);

    await db.update(orders).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await expireStaleOrders()).toBe(1);

    const [order] = await db.select().from(orders);
    expect(order.status).toBe("cancelled");
    expect(await stockOf(variants[0].id)).toBe(5);
    const [d] = await db.select().from(discounts);
    expect(d.usedCount).toBe(0);
  });

  it("reinstates an expired order if its payment arrives late", async () => {
    const { order, variantId } = await cardOrder();
    await db.update(orders).set({ expiresAt: new Date(Date.now() - 1000) });
    await expireStaleOrders();
    expect(await stockOf(variantId)).toBe(5);

    await webhook({ event: "charge.success", data: { id: 55, reference: "REF", amount: 1650000, currency: "NGN", metadata: { orderId: order.id } } });
    const [paid] = await db.select().from(orders);
    expect(paid).toMatchObject({ paymentStatus: "paid", status: "processing" });
    expect(await stockOf(variantId)).toBe(4);
  });

  it("replaces an unpaid card order when the same bag checks out again", async () => {
    const { token, variantId } = await cardOrder(5, 2);
    expect(await stockOf(variantId)).toBe(3);
    const again = await checkout(token, { paymentMethod: "cod" });
    expect(again.status).toBe(200);
    const all = await db.select().from(orders);
    expect(all.map((o) => o.status).sort()).toEqual(["cancelled", "pending"]);
    expect(await stockOf(variantId)).toBe(3);
  });
});

// ── C9: cancelling returns stock ──────────────────────────

describe("cancelling", () => {
  it("returns stock once, even if cancelled twice", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ stock: 4 }] });
    const added = await addToBag(product.id, variants[0].id, 3);
    await checkout(added.body.data.guestToken);
    const [order] = await db.select().from(orders);
    expect(await stockOf(variants[0].id)).toBe(1);

    expect(await db.transaction((tx) => cancelOrder(tx, order.id, "order_cancelled"))).toBe(true);
    expect(await db.transaction((tx) => cancelOrder(tx, order.id, "order_cancelled"))).toBe(false);
    expect(await stockOf(variants[0].id)).toBe(4);
  });

  it("returns nothing for orders placed before stock was tracked", async () => {
    const { variants } = await createProduct({ price: 20000, variants: [{ stock: 4 }] });
    const [legacy] = await db
      .insert(orders)
      .values({ orderNumber: "SC-LEGACY-0001", totalAmount: "20000.00", status: "processing", paymentStatus: "paid" })
      .returning();
    await db.transaction((tx) => cancelOrder(tx, legacy.id, "order_cancelled"));
    expect(await stockOf(variants[0].id)).toBe(4);
  });
});
