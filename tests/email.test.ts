import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, createProduct, json, jsonRequest, seedKadunaRate, signPaystack } from "./support/fixtures";
import { POST as cartPost } from "@/app/api/v1/store/cart/route";
import { POST as checkoutPost } from "@/app/api/v1/store/checkout/route";
import { POST as webhookPost } from "@/app/api/v1/store/webhooks/payment/route";
import { escapeHtml } from "@/lib/email/templates";

type Sent = { to: string[]; subject: string; html: string; reply_to: string };

/** Records Resend calls; answers Paystack initialize so card checkout works. */
function mockNetwork() {
  const sent: Sent[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u === "https://api.resend.com/emails") {
        sent.push(JSON.parse(String(init?.body)));
        return Response.json({ id: "email_1" });
      }
      if (u.includes("/transaction/initialize")) {
        return Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/x", access_code: "x", reference: "REF" } });
      }
      throw new Error(`Unexpected fetch ${u}`);
    })
  );
  return sent;
}

async function placeOrder(paymentMethod: "cod" | "paystack", firstName = ADDRESS.firstName) {
  const { product, variants } = await createProduct({ name: "Emerald Abaya", price: 20000, variants: [{ stock: 5, size: "M", color: "Green" }] });
  const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id })));
  return json(
    await checkoutPost(
      jsonRequest(
        "/api/v1/store/checkout",
        { guestEmail: "aisha@example.com", shippingAddress: { ...ADDRESS, firstName }, paymentMethod },
        { "x-guest-token": added.body.data.guestToken }
      )
    )
  );
}

beforeEach(async () => {
  await resetTestDb();
  await seedKadunaRate();
  env.RESEND_API_KEY = "re_test";
  env.EMAIL_FROM = "Sleekandchic <orders@sleekandchic.com>";
});

afterEach(() => {
  vi.unstubAllGlobals();
  env.RESEND_API_KEY = undefined;
  env.EMAIL_FROM = undefined;
});

describe("order emails", () => {
  it("emails the customer and the shop when a pay-on-delivery order is placed", async () => {
    const sent = mockNetwork();
    const res = await placeOrder("cod");
    expect(res.body.data.confirmationEmail).toBe("aisha@example.com");

    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const customer = sent.find((e) => e.to[0] === "aisha@example.com")!;
    const shop = sent.find((e) => e.to[0] === "sleekandchic.it@gmail.com")!;
    expect(customer.subject).toMatch(/^Order received: SC-/);
    expect(customer.html).toContain("Emerald Abaya");
    expect(customer.html).toContain("in cash or by POS");
    expect(customer.reply_to).toBe("sleekandchic.it@gmail.com");
    expect(shop.subject).toMatch(/pay on delivery/);
    expect(shop.html).toContain("wa.me/2348030000000");
  });

  it("waits for payment before announcing a card order, then sends once", async () => {
    const sent = mockNetwork();
    await placeOrder("paystack");
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(0);

    const [order] = await db.select().from(orders);
    const body = JSON.stringify({ event: "charge.success", data: { id: 1, reference: "REF", amount: 2150000, currency: "NGN", metadata: { orderId: order.id } } });
    const { NextRequest } = await import("next/server");
    const hook = () =>
      webhookPost(new NextRequest("http://localhost:3000/api/v1/store/webhooks/payment", { method: "POST", body, headers: { "x-paystack-signature": signPaystack(body) } }));
    await hook();
    await hook(); // Paystack retry
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(2);
    expect(sent.find((e) => e.to[0] === "aisha@example.com")!.subject).toMatch(/^Payment received/);
  });

  it("escapes customer-entered text", async () => {
    const sent = mockNetwork();
    await placeOrder("cod", `<img src=x onerror=alert(1)>`);
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    for (const email of sent) expect(email.html).not.toContain("<img src=x");
    expect(escapeHtml(`<a href="x">`)).toBe("&lt;a href=&quot;x&quot;&gt;");
  });

  it("logs instead of sending, and makes no claim, when email isn't configured", async () => {
    env.RESEND_API_KEY = undefined;
    const sent = mockNetwork();
    const res = await placeOrder("cod");
    expect(res.body.data.confirmationEmail).toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(0);
  });
});

describe("contact form", () => {
  it("emails the shop with the customer as reply-to, and drops bot submissions", async () => {
    const { POST: contactPost } = await import("@/app/api/v1/store/contact/route");
    const sent = mockNetwork();
    const message = { name: "Aisha", email: "aisha@example.com", message: "Do you have the emerald abaya in size L?" };
    const ok = await json(await contactPost(jsonRequest("/api/v1/store/contact", message)));
    expect(ok.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: ["sleekandchic.it@gmail.com"], reply_to: "aisha@example.com" });

    const bot = await json(await contactPost(jsonRequest("/api/v1/store/contact", { ...message, website: "spam.example" })));
    expect(bot.status).toBe(200);
    expect(sent).toHaveLength(1);
  });

  it("says plainly when the form can't send", async () => {
    const { POST: contactPost } = await import("@/app/api/v1/store/contact/route");
    env.RESEND_API_KEY = undefined;
    const res = await json(await contactPost(jsonRequest("/api/v1/store/contact", { name: "A", email: "a@example.com", message: "Hello there" })));
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/WhatsApp us on \+234 903 377 7385/);
  });
});
