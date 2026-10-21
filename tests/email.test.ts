import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { contactMessages, orders } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { DEFAULT_SETTINGS, saveSettings } from "@/lib/services/settings";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, createProduct, json, jsonRequest, seedKadunaRate, signPaystack } from "./support/fixtures";
import { POST as cartPost } from "@/app/api/v1/store/cart/route";
import { POST as checkoutPost } from "@/app/api/v1/store/checkout/route";
import { POST as webhookPost } from "@/app/api/v1/store/webhooks/payment/route";
import { escapeHtml, testEmail } from "@/lib/email/templates";

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

async function placeOrder(deliveryPayment: "online" | "on_arrival" = "online", firstName = ADDRESS.firstName) {
  const { product, variants } = await createProduct({ name: "Emerald Abaya", price: 20000, variants: [{ stock: 5, size: "M", color: "Green" }] });
  const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id })));
  return json(
    await checkoutPost(
      jsonRequest(
        "/api/v1/store/checkout",
        { guestEmail: "aisha@example.com", shippingAddress: { ...ADDRESS, firstName }, deliveryPayment },
        { "x-guest-token": added.body.data.guestToken }
      )
    )
  );
}

/** Paystack confirms the order's payment (₦20,000 item + ₦1,500 delivery unless that's paid at the park). */
async function pay(amountKobo = 2150000) {
  const [order] = await db.select().from(orders);
  const body = JSON.stringify({ event: "charge.success", data: { id: 1, reference: "REF", amount: amountKobo, currency: "NGN", metadata: { orderId: order.id } } });
  const { NextRequest } = await import("next/server");
  return webhookPost(
    new NextRequest("http://localhost:3000/api/v1/store/webhooks/payment", { method: "POST", body, headers: { "x-paystack-signature": signPaystack(body) } })
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
  it("tells the customer and the shop what's left to pay at the park", async () => {
    const sent = mockNetwork();
    await placeOrder("on_arrival");
    await pay(2000000);

    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const customer = sent.find((e) => e.to[0] === "aisha@example.com")!;
    const shop = sent.find((e) => e.to[0] === "sleekandchic5@gmail.com")!;
    expect(customer.subject).toMatch(/^Payment received: SC-/);
    expect(customer.html).toContain("Emerald Abaya");
    expect(customer.html).toContain("motor park in Kaduna");
    expect(customer.html).toContain("delivery fee at the park");
    expect(customer.reply_to).toBe("sleekandchic5@gmail.com");
    expect(shop.subject).toMatch(/\(paid\)/);
    expect(shop.html).toContain("delivery fee at the park");
    expect(shop.html).toContain("Public transport");
    expect(shop.html).toContain("wa.me/2348030000000");
  });

  it("waits for payment before announcing a card order, then sends once", async () => {
    const sent = mockNetwork();
    await placeOrder();
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(0);

    await pay();
    await pay(); // Paystack retry
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(2);
    expect(sent.find((e) => e.to[0] === "aisha@example.com")!.subject).toMatch(/^Payment received/);
  });

  it("escapes customer-entered text", async () => {
    const sent = mockNetwork();
    await placeOrder("online", `<img src=x onerror=alert(1)>`);
    await pay();
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    for (const email of sent) expect(email.html).not.toContain("<img src=x");
    expect(escapeHtml(`<a href="x">`)).toBe("&lt;a href=&quot;x&quot;&gt;");
  });

  it("logs instead of sending when email isn't configured", async () => {
    env.RESEND_API_KEY = undefined;
    const sent = mockNetwork();
    await placeOrder();
    await pay();
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
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ to: ["sleekandchic5@gmail.com"], reply_to: "aisha@example.com" });

    const bot = await json(await contactPost(jsonRequest("/api/v1/store/contact", { ...message, website: "spam.example" })));
    expect(bot.status).toBe(200);
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(1);
    expect(await db.select().from(contactMessages)).toHaveLength(1);
  });

  it("keeps the message for the admin's inbox when email isn't set up", async () => {
    const { POST: contactPost } = await import("@/app/api/v1/store/contact/route");
    env.RESEND_API_KEY = undefined;
    const res = await json(await contactPost(jsonRequest("/api/v1/store/contact", { name: "A", email: "a@example.com", message: "Hello there" })));
    expect(res.status).toBe(200);
    const [saved] = await db.select().from(contactMessages);
    expect(saved).toMatchObject({ name: "A", email: "a@example.com", message: "Hello there", status: "new" });
  });
});

describe("shop alerts", () => {
  it("send new orders to the addresses chosen in Settings, with sizes running low", async () => {
    await saveSettings(
      {
        ...DEFAULT_SETTINGS,
        notifications: { ...DEFAULT_SETTINGS.notifications, recipients: ["salma@example.com", "staff@example.com"] },
        inventory: { lowStockThreshold: 5 },
      },
      null
    );
    const sent = mockNetwork();
    await placeOrder(); // takes 1 of the 5 in stock, leaving 4
    await pay();
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const shop = sent.find((e) => e.subject.startsWith("New order"))!;
    expect(shop.to).toEqual(["salma@example.com", "staff@example.com"]);
    expect(shop.html).toContain("Running low");
    expect(shop.html).toContain("Emerald Abaya - Green, M");
    expect(shop.html).toContain("4 left");
  });

  it("can be turned off, while the customer still gets their receipt", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, notifications: { ...DEFAULT_SETTINGS.notifications, newOrder: false } }, null);
    const sent = mockNetwork();
    await placeOrder();
    await pay();
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual(["aisha@example.com"]);
  });

  it("go out by SMTP (e.g. Gmail) when that's set up", async () => {
    const sendMail = vi.fn(async () => ({ messageId: "1" }));
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);
    env.RESEND_API_KEY = undefined;
    env.EMAIL_FROM = undefined;
    Object.assign(env, { SMTP_HOST: "smtp.gmail.com", SMTP_USER: "sleekandchic5@gmail.com", SMTP_PASS: "app-password" });
    try {
      const { deliverEmail, emailSender } = await import("@/lib/email/send");
      expect(emailSender()).toBe("Sleekandchic <sleekandchic5@gmail.com>");
      expect(await deliverEmail(testEmail(["salma@example.com"], "Salma"))).toEqual({ sent: true });
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: "Sleekandchic <sleekandchic5@gmail.com>", to: ["salma@example.com"], subject: "Test email from Sleekandchic" })
      );
    } finally {
      Object.assign(env, { SMTP_HOST: undefined, SMTP_USER: undefined, SMTP_PASS: undefined });
      vi.restoreAllMocks();
    }
  });
});
