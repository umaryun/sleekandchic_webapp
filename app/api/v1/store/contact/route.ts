import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { afterResponse } from "@/lib/email/send";
import { notifyContactMessage } from "@/lib/email/notify";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email so we can reply"),
  phone: z.string().trim().max(30).optional(),
  orderNumber: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5, "Write a short message").max(3000),
  // Hidden field; people leave it empty, bots fill it in.
  website: z.string().optional(),
});

/**
 * POST /api/v1/store/contact — saves a customer's message for the admin's
 * Messages page and emails it to the shop (when email is set up).
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "contact");
    if (limited) return limited;

    const { data, error } = await parseBody(req, contactSchema);
    if (error) return error;
    if (data!.website) return apiSuccess({ sent: true }); // spam: accept silently

    const { name, email, phone, orderNumber, message } = data!;
    await db.insert(contactMessages).values({
      name,
      email,
      phone: phone || null,
      orderNumber: orderNumber || null,
      message,
    });
    afterResponse(() => notifyContactMessage({ name, email, phone, orderNumber, message }));
    return apiSuccess({ sent: true });
  } catch (err) {
    console.error("POST /api/v1/store/contact error:", err);
    return apiError("Internal server error", 500);
  }
}
