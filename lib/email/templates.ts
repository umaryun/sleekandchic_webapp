import { env } from "@/lib/env";
import { DELIVERY, STORE, whatsappLink, whatsappTo } from "@/lib/store";
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
<tr><td style="font-size:12px;color:#6b6b6b;padding-top:24px;border-top:1px solid #eee">
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

// ── Staff ──────────────────────────────────────────────

const roleLabel = (role: string) => (role === "super_admin" ? "owner" : "staff");

/** Sent to a new staff member, who has no password yet. */
export function staffInviteEmail(to: string, name: string, role: string, setupUrl: string, hoursValid: number): Email {
  return {
    to,
    subject: `You've been added to the ${STORE.name} admin`,
    html: layout(
      "Set up your admin account",
      `<p>Hi ${escapeHtml(name || "there")},</p>
<p>You've been given ${roleLabel(role)} access to the ${STORE.name} admin console. Choose a password to finish setting up your account:</p>
${button(setupUrl, "Choose a password")}
<p style="color:#666">This link works once and expires in ${hoursValid} hours. If you weren't expecting this, ignore this email.</p>`
    ),
    text: `You've been given ${roleLabel(role)} access to the ${STORE.name} admin console. Choose a password: ${setupUrl}\n\nThis link works once and expires in ${hoursValid} hours.`,
  };
}

/** Sent to an existing customer who was given staff access; their password is unchanged. */
export function staffAccessEmail(to: string, name: string, role: string, adminUrl: string): Email {
  return {
    to,
    subject: `You now have access to the ${STORE.name} admin`,
    html: layout(
      "You have admin access",
      `<p>Hi ${escapeHtml(name || "there")},</p>
<p>Your ${STORE.name} account now has ${roleLabel(role)} access to the admin console. Sign in with the email and password you already use:</p>
${button(`${adminUrl}/login`, "Open the admin console")}
<p style="color:#666">If you weren't expecting this, reply to this email.</p>`
    ),
    text: `Your ${STORE.name} account now has ${roleLabel(role)} access to the admin console. Sign in with your existing password: ${adminUrl}/login`,
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
  paymentMethod: "paystack" | "cod" | "transfer" | "cash" | "pos" | null;
  paymentStatus: string;
  shippingMethod: "standard" | "express" | "pickup" | null;
  /** GIG waybill, or the driver and park for public transport. */
  trackingNumber: string | null;
  /** "on_arrival": the customer pays the delivery fee at the park. */
  deliveryPayment: "online" | "on_arrival";
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  shippingFee: number;
  totalAmount: number;
  items: { name: string; size: string | null; color: string | null; quantity: number; price: number }[];
}

export const trackingUrl = (orderNumber: string) =>
  `${env.BETTER_AUTH_URL}/orders/tracking?order=${encodeURIComponent(orderNumber)}`;

const atPark = (o: OrderEmailData) => (o.deliveryPayment === "on_arrival" ? o.shippingFee : 0);
const paidOnline = (o: OrderEmailData) => o.totalAmount - atPark(o);
const methodName = (o: OrderEmailData) =>
  o.shippingMethod === "pickup" ? "Pickup from our shop" : DELIVERY.methods[o.shippingMethod ?? "standard"].name;

/** Where the order goes and, for public transport, what's still to pay at the park. */
function deliveryNote(o: OrderEmailData) {
  if (o.shippingMethod === "pickup") return `It's ready for you to collect from our shop: ${STORE.address}.`;
  if (o.shippingMethod === "express") return `${DELIVERY.methods.express.name} will deliver it to your door.`;
  const fee = atPark(o) > 0 ? ` Please pay the ${naira(atPark(o))} delivery fee at the park when you collect it.` : "";
  return `It travels by public transport to the motor park in ${o.state || "your state"}, where you collect it.${fee}`;
}

function itemsTable(order: OrderEmailData) {
  const rows = order.items
    .map((i) => {
      const options = [i.color, i.size].filter(Boolean).join(", ");
      return `<tr><td style="padding:6px 0">${i.quantity} × ${escapeHtml(i.name)}${options ? `<br><span style="color:#6b6b6b;font-size:12px">${escapeHtml(options)}</span>` : ""}</td><td align="right" style="padding:6px 0;white-space:nowrap">${naira(i.price * i.quantity)}</td></tr>`;
    })
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold" : "color:#666"}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;font-size:14px">
${rows}
${line("Subtotal", naira(order.subtotal))}
${order.discountAmount > 0 ? line(`Discount${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}`, `-${naira(order.discountAmount)}`) : ""}
${line(`Delivery (${methodName(order)})`, order.shippingFee === 0 ? "Free" : `${naira(order.shippingFee)}${atPark(order) > 0 ? " at the park" : ""}`)}
${line("Total", naira(order.totalAmount), true)}
${atPark(order) > 0 ? `${line("Paid online", naira(paidOnline(order)))}${line("To pay at the park", naira(atPark(order)))}` : ""}
</table>`;
}

function itemsText(order: OrderEmailData) {
  return order.items
    .map((i) => `${i.quantity} x ${i.name}${i.size || i.color ? ` (${[i.color, i.size].filter(Boolean).join(", ")})` : ""} - ${naira(i.price * i.quantity)}`)
    .join("\n");
}

const deliveryHtml = (o: OrderEmailData) =>
  `<p><strong>Delivery to</strong><br>${escapeHtml(`${o.firstName} ${o.lastName}`)}<br>${escapeHtml(o.street)}<br>${escapeHtml(`${o.city}, ${o.state}`)}<br>${escapeHtml(o.phone)}</p>`;

/** To the customer once their payment is received (or an older pay-on-delivery order is placed). */
export function orderConfirmationEmail(order: OrderEmailData): Email {
  const paid = order.paymentStatus === "paid";
  const heading = paid ? "Payment received. Thank you!" : "We've got your order";
  // Unpaid: an older pay-on-delivery order, or a sale staff recorded before the money came in.
  const unpaidText =
    order.paymentMethod === "cod"
      ? `You'll pay ${naira(order.totalAmount)} in cash or by POS when your order arrives. We'll call ${order.phone} to confirm delivery.`
      : `Payment of ${naira(order.totalAmount)} is still to come. We'll let you know as soon as we receive it.`;
  const paymentLine = paid
    ? `<p>We've received your payment of <strong>${naira(paidOnline(order))}</strong>. ${escapeHtml(deliveryNote(order))}</p>`
    : `<p>${escapeHtml(unpaidText)}</p>`;
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
      paid ? `Paid ${naira(paidOnline(order))}. ${deliveryNote(order)}` : unpaidText
    }\n\nTrack your order: ${trackingUrl(order.orderNumber)}`,
  };
}

const statusCopy: Record<string, { subject: string; heading: string; body: string }> = {
  shipped: {
    subject: "Your order is on its way",
    heading: "Your order is on its way",
    body: "Your order has left us and is on its way to you.",
  },
  delivered: {
    subject: "Your order was delivered",
    heading: "Delivered",
    body: `Your order has been delivered. If you need to return anything, you have ${STORE.returnsWindow} from delivery; see our returns & refund policy on our website. If anything arrived damaged or defective, tell us straight away.`,
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
  const tracking = status === "shipped" && order.trackingNumber ? order.trackingNumber : null;
  const trackingLabel = order.shippingMethod === "express" ? "GIG waybill number" : "Delivery details";
  return {
    to: order.email,
    subject: `${copy.subject}: ${order.orderNumber}`,
    html: layout(
      copy.heading,
      `<p>Hi ${escapeHtml(order.firstName)},</p><p>${escapeHtml(status === "shipped" ? `${copy.body} ${deliveryNote(order)}` : copy.body)}</p>
${tracking ? `<p style="background:#f5f3f1;border-radius:6px;padding:12px 14px"><span style="color:#6b6b6b;font-size:12px">${trackingLabel}</span><br><strong style="font-size:16px">${escapeHtml(tracking)}</strong></p>` : ""}
<p>Order <strong>${order.orderNumber}</strong> · ${naira(order.totalAmount)}${
        order.paymentMethod === "cod" && order.paymentStatus !== "paid" && status !== "cancelled"
          ? " · pay on delivery"
          : ""
      }</p>
${status === "cancelled" ? "" : button(trackingUrl(order.orderNumber), "Track your order")}`
    ),
    text: `${status === "shipped" ? `${copy.body} ${deliveryNote(order)}` : copy.body}${tracking ? `\n${trackingLabel}: ${tracking}` : ""}\n\nOrder ${order.orderNumber}\nTrack: ${trackingUrl(order.orderNumber)}`,
  };
}

export interface LowStockLine {
  productName: string;
  size: string | null;
  color: string | null;
  stock: number;
}

/** A page in the admin console, when its address is known. */
const adminLink = (path: string) =>
  env.ADMIN_APP_URL ? `${env.ADMIN_APP_URL.split(",")[0].trim().replace(/\/$/, "")}${path}` : null;

const describeLine = (l: LowStockLine) => [l.productName, [l.color, l.size].filter(Boolean).join(", ")].filter(Boolean).join(" - ");
const stockWords = (n: number) => (n <= 0 ? "sold out" : `${n} left`);

/** To the shop: a new order to fulfil, with any sizes it left running low. */
export function ownerNewOrderEmail(order: OrderEmailData, to: string | string[], lowStock: LowStockLine[] = []): Email {
  const payment =
    order.paymentMethod === "cod"
      ? "Pay on delivery: call the customer to confirm."
      : order.paymentStatus === "paid"
        ? atPark(order) > 0
          ? `Paid ${naira(paidOnline(order))} online (Paystack). The customer pays the ${naira(atPark(order))} delivery fee at the park.`
          : "Paid in full online (Paystack)."
        : "Online payment pending.";
  const wa = whatsappTo(order.phone, `Hello ${order.firstName}, this is ${STORE.name} about your order ${order.orderNumber}.`);
  const open = adminLink(`/orders/${order.id}`);
  const lowHtml = lowStock.length
    ? `<p style="background:#fbf3e4;border-radius:6px;padding:12px 14px"><strong>Running low</strong><br>${lowStock
        .map((l) => `${escapeHtml(describeLine(l))}: <strong>${stockWords(l.stock)}</strong>`)
        .join("<br>")}</p>`
    : "";
  const lowText = lowStock.length
    ? `\n\nRunning low:\n${lowStock.map((l) => `${describeLine(l)}: ${stockWords(l.stock)}`).join("\n")}`
    : "";
  return {
    to,
    subject: `New order ${order.orderNumber}: ${naira(order.totalAmount)} (${order.paymentMethod === "cod" ? "pay on delivery" : "paid"})`,
    html: layout(
      `New order ${order.orderNumber}`,
      `<p><strong>${escapeHtml(payment)}</strong></p>
<p>Delivery: <strong>${escapeHtml(methodName(order))}</strong></p>
<p>${escapeHtml(`${order.firstName} ${order.lastName}`)} · <a href="tel:${escapeHtml(order.phone)}" style="color:#8a6452">${escapeHtml(order.phone)}</a> · <a href="${wa}" style="color:#8a6452">WhatsApp</a> · ${escapeHtml(order.email)}</p>
${itemsTable(order)}
${deliveryHtml(order)}
${lowHtml}
${open ? button(open, "Open in the admin") : ""}`
    ),
    text: `New order ${order.orderNumber}\n${payment}\nDelivery: ${methodName(order)}\n${order.firstName} ${order.lastName} ${order.phone} ${order.email}\n${itemsText(order)}\nTotal: ${naira(order.totalAmount)}\nDeliver to: ${order.street}, ${order.city}, ${order.state}${lowText}${open ? `\n\nOpen in the admin: ${open}` : ""}`,
  };
}

// ── Shop alerts ────────────────────────────────────────

/** To the shop: someone wrote through the contact form. Replies go to them. */
export function contactMessageEmail(
  message: { name: string; email: string; phone?: string | null; orderNumber?: string | null; message: string },
  to: string | string[]
): Email {
  const details = [`From: ${message.name} <${message.email}>`, message.phone && `Phone: ${message.phone}`, message.orderNumber && `Order: ${message.orderNumber}`]
    .filter(Boolean)
    .join("\n");
  const open = adminLink("/messages");
  return {
    to,
    replyTo: message.email,
    subject: `Website message from ${message.name}${message.orderNumber ? ` (order ${message.orderNumber})` : ""}`,
    text: `${details}\n\n${message.message}${open ? `\n\nAll messages: ${open}` : ""}`,
    html: layout(
      `Message from ${message.name}`,
      `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;margin:0">${escapeHtml(`${details}\n\n${message.message}`)}</pre>
<p style="color:#666">Reply to this email to answer ${escapeHtml(message.name)}.</p>
${open ? button(open, "Open messages in the admin") : ""}`
    ),
  };
}

/** From the admin's Settings page, to check that alerts arrive. */
export function testEmail(to: string | string[], sentBy: string): Email {
  return {
    to,
    subject: `Test email from ${STORE.name}`,
    text: `This is a test from the ${STORE.name} admin, sent by ${sentBy}. New-order alerts will arrive at this address.`,
    html: layout(
      "Email is working",
      `<p>This is a test from the ${STORE.name} admin, sent by ${escapeHtml(sentBy)}.</p><p>New-order alerts will arrive at this address.</p>`
    ),
  };
}
