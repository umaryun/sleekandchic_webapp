import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store";

export interface Email {
  /** One address, or several (each sees the others, so use it for the shop's own alerts). */
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Where replies go; defaults to the store's contact email. */
  replyTo?: string;
}

/**
 * How email goes out. SMTP (e.g. the shop's Gmail with an app password) works
 * without owning a domain; Resend needs EMAIL_FROM on a domain verified there.
 * SMTP wins when both are set.
 */
export function emailProvider(): "smtp" | "resend" | null {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return "smtp";
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return "resend";
  return null;
}

export function isEmailConfigured() {
  return emailProvider() !== null;
}

/** The sender customers see, e.g. "Sleekandchic <sleekandchic5@gmail.com>". */
export function emailSender(): string | null {
  const provider = emailProvider();
  if (provider === "smtp") return env.EMAIL_FROM || `${STORE.name} <${env.SMTP_USER}>`;
  if (provider === "resend") return env.EMAIL_FROM!;
  return null;
}

let transporter: Transporter | null = null;

function smtpTransporter() {
  const port = env.SMTP_PORT ?? 465;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    // 465 is TLS from the start; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

const describeTo = (to: Email["to"]) => (Array.isArray(to) ? to.join(", ") : to);

/**
 * Sends the email. Never throws: a failed email must not fail the order or
 * payment that triggered it. Returns whether it was sent.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  return (await deliverEmail(email)).sent;
}

/** Like sendEmail, with the reason when it wasn't sent (for the admin's test email). */
export async function deliverEmail(email: Email): Promise<{ sent: true } | { sent: false; error: string }> {
  const provider = emailProvider();
  if (!provider) {
    console.info(`[email not sent: email isn't set up, see .env.example] to=${describeTo(email.to)} subject="${email.subject}"`);
    return { sent: false, error: "Email isn't set up on the shop's server yet." };
  }
  const to = Array.isArray(email.to) ? email.to : [email.to];
  if (to.length === 0) return { sent: false, error: "No one to send it to." };
  try {
    if (provider === "smtp") {
      await smtpTransporter().sendMail({
        from: emailSender()!,
        to,
        replyTo: email.replyTo ?? STORE.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      return { sent: true };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        reply_to: email.replyTo ?? STORE.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Resend rejected email to ${describeTo(email.to)} (${res.status}): ${detail}`);
      return { sent: false, error: `Resend refused it (${res.status}). Check that EMAIL_FROM is on a domain verified in Resend.` };
    }
    return { sent: true };
  } catch (err) {
    console.error(`Sending email to ${describeTo(email.to)} failed:`, err);
    const code = (err as { code?: string; responseCode?: number }).code;
    if (code === "EAUTH") {
      return { sent: false, error: "The mail server refused the sign-in. For Gmail, SMTP_PASS must be an app password, not the account password." };
    }
    return { sent: false, error: "Couldn't reach the mail server. Check SMTP_HOST and SMTP_PORT." };
  }
}

/**
 * Runs a task after the response is sent so customers don't wait on email.
 * Outside a request (scripts, tests) there is no response to wait for, so it
 * runs immediately.
 */
export function afterResponse(task: () => Promise<unknown>) {
  const run = () => task().catch((err) => console.error("Background task failed:", err));
  try {
    after(run);
  } catch {
    void run();
  }
}
