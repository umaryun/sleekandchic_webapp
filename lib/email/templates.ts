import { env } from "@/lib/env";
import { STORE, whatsappLink, whatsappTo } from "@/lib/store";
import type { Email } from "@/lib/email/send";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function layout(heading: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f3f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px;padding:28px">
<tr><td style="font-size:20px;font-weight:bold;letter-spacing:1px;color:#8a6452;padding-bottom:18px">${STORE.name.toUpperCase()}</td></tr>
<tr><td style="font-size:20px;font-weight:bold;padding-bottom:12px">${escapeHtml(heading)}</td></tr>
<tr><td style="font-size:14px;line-height:1.6;color:#333">${bodyHtml}</td></tr>
<tr><td style="font-size:12px;color:#888;padding-top:24px;border-top:1px solid #eee">
Questions? Reply to this email, WhatsApp <a href="${whatsappLink()}" style="color:#8a6452">${STORE.phoneDisplay}</a>, or email ${STORE.email}.<br>${escapeHtml(STORE.address)}
</td></tr></table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${href}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:bold;display:inline-block">${escapeHtml(label)}</a></p>`;

// ── Password reset ─────────────────────────────────────

export function passwordResetEmail(to: string, name: string, url: string): Email {
  return {
    to,
    subject: `Reset your ${STORE.name} password`,
    html: layout(
      "Reset your password",
      `<p>Hi ${escapeHtml(name || "there")},</p>
<p>Someone asked to reset the password for your ${STORE.name} account. If that was you, choose a new password:</p>
${button(url, "Choose a new password")}
<p style="color:#666">This link expires in 1 hour. If you didn't ask for this, ignore this email; your password won't change.</p>`
    ),
    text: `Reset your ${STORE.name} password: ${url}\n\nThis link expires in 1 hour. If you didn't ask for this, ignore this email.`,
  };
}

// ── Orders ─────────────────────────────────────────────

export interface OrderEmailData {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  email: string;
  paymentMethod: "paystack" | "cod" | null;
  paymentStatus: string;
  shippingMethod: "standard" | "express" | null;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  shippingFee: number;
  totalAmount: number;
  items: { name: string; size: string | null; color: string | null; quantity: number; price: number }[];
}

export const trackingUrl = (orderNumber: string) =>
  `${env.BETTER_AUTH_URL}/orders/tracking?order=${encodeURIComponent(orderNumber)}`;

function itemsTable(order: OrderEmailData) {
  const rows = order.items
    .map((i) => {
      const options = [i.color, i.size].filter(Boolean).join(", ");
      return `<tr><td style="padding:6px 0">${i.quantity} × ${escapeHtml(i.name)}${options ? `<br><span style="color:#888;font-size:12px">${escapeHtml(options)}</span>` : ""}</td><td align="right" style="padding:6px 0;white-space:nowrap">${naira(i.price * i.quantity)}</td></tr>`;
    })
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold" : "color:#666"}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;font-size:14px">
${rows}
${line("Subtotal", naira(order.subtotal))}
${order.discountAmount > 0 ? line(`Discount${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}`, `-${naira(order.discountAmount)}`) : ""}
${line(`${order.shippingMethod === "express" ? "Express" : "Standard"} delivery`, order.shippingFee === 0 ? "Free" : naira(order.shippingFee))}
${line("Total", naira(order.totalAmount), true)}
</table>`;
}

function itemsText(order: OrderEmailData) {
  return order.items
    .map((i) => `${i.quantity} x ${i.name}${i.size || i.color ? ` (${[i.color, i.size].filter(Boolean).join(", ")})` : ""} - ${naira(i.price * i.quantity)}`)
    .join("\n");
}

const deliveryHtml = (o: OrderEmailData) =>
  `<p><strong>Delivery to</strong><br>${escapeHtml(`${o.firstName} ${o.lastName}`)}<br>${escapeHtml(o.street)}<br>${escapeHtml(`${o.city}, ${o.state}`)}<br>${escapeHtml(o.phone)}</p>`;

/** To the customer: pay-on-delivery order placed, or card payment received. */
export function orderConfirmationEmail(order: OrderEmailData): Email {
  const paid = order.paymentStatus === "paid";
  const heading = paid ? "Payment received. Thank you!" : "We've got your order";
  const paymentLine = paid
    ? `<p>We've received your payment of <strong>${naira(order.totalAmount)}</strong>.</p>`
    : `<p>You'll pay <strong>${naira(order.totalAmount)}</strong> in cash or by POS when your order arrives. We'll call ${escapeHtml(order.phone)} to confirm delivery.</p>`;
  return {
    to: order.email,
    subject: `${paid ? "Payment received" : "Order received"}: ${order.orderNumber}`,
    html: layout(
      heading,
      `<p>Hi ${escapeHtml(order.firstName)},</p>
<p>Your order <strong>${order.orderNumber}</strong> is confirmed and we're preparing it.</p>
${paymentLine}
${itemsTable(order)}
${deliveryHtml(order)}
${button(trackingUrl(order.orderNumber), "Track your order")}`
    ),
    text: `${heading}\n\nOrder ${order.orderNumber}\n${itemsText(order)}\nTotal: ${naira(order.totalAmount)}\n\n${
      paid ? "Paid." : `Pay on delivery. We'll call ${order.phone} to confirm delivery.`
    }\n\nTrack your order: ${trackingUrl(order.orderNumber)}`,
  };
}

const statusCopy: Record<string, { subject: string; heading: string; body: string }> = {
  shipped: {
    subject: "Your order is on its way",
    heading: "Your order is on its way",
    body: "Your order has left us and is on its way to you. The courier will call before delivery.",
  },
  delivered: {
    subject: "Your order was delivered",
    heading: "Delivered",
    body: `Your order has been delivered. If anything arrived faulty, damaged or wrong, tell us within ${STORE.returnsWindowHours} hours and we'll put it right.`,
  },
  cancelled: {
    subject: "Your order was cancelled",
    heading: "Your order was cancelled",
    body: "Your order has been cancelled. If you paid and haven't been refunded, reply to this email with your order number.",
  },
};

export function hasStatusEmail(status: string) {
  return status in statusCopy;
}

/** To the customer when the shop moves the order along. */
export function orderStatusEmail(order: OrderEmailData, status: keyof typeof statusCopy): Email {
  const copy = statusCopy[status];
  return {
    to: order.email,
    subject: `${copy.subject}: ${order.orderNumber}`,
    html: layout(
      copy.heading,
      `<p>Hi ${escapeHtml(order.firstName)},</p><p>${escapeHtml(copy.body)}</p>
<p>Order <strong>${order.orderNumber}</strong> · ${naira(order.totalAmount)}${
        order.paymentMethod === "cod" && order.paymentStatus !== "paid" && status !== "cancelled"
          ? " · pay on delivery"
          : ""
      }</p>
${status === "cancelled" ? "" : button(trackingUrl(order.orderNumber), "Track your order")}`
    ),
    text: `${copy.body}\n\nOrder ${order.orderNumber}\nTrack: ${trackingUrl(order.orderNumber)}`,
  };
}

/** To the shop: a new order to fulfil. */
export function ownerNewOrderEmail(order: OrderEmailData, to: string): Email {
  const payment =
    order.paymentMethod === "cod"
      ? "Pay on delivery: call the customer to confirm."
      : order.paymentStatus === "paid"
        ? "Paid by card/transfer (Paystack)."
        : "Card payment pending.";
  const wa = whatsappTo(order.phone, `Hello ${order.firstName}, this is ${STORE.name} about your order ${order.orderNumber}.`);
  return {
    to,
    subject: `New order ${order.orderNumber}: ${naira(order.totalAmount)} (${order.paymentMethod === "cod" ? "pay on delivery" : "paid"})`,
    html: layout(
      `New order ${order.orderNumber}`,
      `<p><strong>${escapeHtml(payment)}</strong></p>
<p>${escapeHtml(`${order.firstName} ${order.lastName}`)} · <a href="tel:${escapeHtml(order.phone)}" style="color:#8a6452">${escapeHtml(order.phone)}</a> · <a href="${wa}" style="color:#8a6452">WhatsApp</a> · ${escapeHtml(order.email)}</p>
${itemsTable(order)}
${deliveryHtml(order)}`
    ),
    text: `New order ${order.orderNumber}\n${payment}\n${order.firstName} ${order.lastName} ${order.phone} ${order.email}\n${itemsText(order)}\nTotal: ${naira(order.totalAmount)}\nDeliver to: ${order.street}, ${order.city}, ${order.state}`,
  };
}
