import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { escapeHtml } from "@/lib/email/templates";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email so we can reply"),
  phone: z.string().trim().max(30).optional(),
  orderNumber: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5, "Write a short message").max(3000),
  // Hidden field; people leave it empty, bots fill it in.
  website: z.string().optional(),
});

/** POST /api/v1/store/contact — emails a customer's message to the shop. */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "contact");
    if (limited) return limited;

    const { data, error } = await parseBody(req, contactSchema);
    if (error) return error;
    if (data!.website) return apiSuccess({ sent: true }); // spam: accept silently

    if (!isEmailConfigured()) {
      return apiError(`Our message form isn't available right now. Please WhatsApp us on ${STORE.phoneDisplay} or email ${STORE.email}.`, 503);
    }

    const { name, email, phone, orderNumber, message } = data!;
    const details = [`From: ${name} <${email}>`, phone && `Phone: ${phone}`, orderNumber && `Order: ${orderNumber}`]
      .filter(Boolean)
      .join("\n");
    const sent = await sendEmail({
      to: env.OWNER_NOTIFICATION_EMAIL || STORE.email,
      replyTo: email,
      subject: `Website message from ${name}${orderNumber ? ` (order ${orderNumber})` : ""}`,
      text: `${details}\n\n${message}`,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(`${details}\n\n${message}`)}</pre>`,
    });
    if (!sent) {
      return apiError(`Your message didn't send. Please WhatsApp us on ${STORE.phoneDisplay} instead.`, 502);
    }
    return apiSuccess({ sent: true });
  } catch (err) {
    console.error("POST /api/v1/store/contact error:", err);
    return apiError("Internal server error", 500);
  }
}
