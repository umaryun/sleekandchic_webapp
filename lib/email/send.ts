import { after } from "next/server";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store";

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Where replies go; defaults to the store's contact email. */
  replyTo?: string;
}

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

/**
 * Sends through Resend. Never throws: a failed email must not fail the order
 * or payment that triggered it. Returns whether it was sent.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.info(`[email not sent: set RESEND_API_KEY and EMAIL_FROM] to=${email.to} subject="${email.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email.to],
        reply_to: email.replyTo ?? STORE.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Resend rejected email to ${email.to} (${res.status}): ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Sending email to ${email.to} failed:`, err);
    return false;
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
