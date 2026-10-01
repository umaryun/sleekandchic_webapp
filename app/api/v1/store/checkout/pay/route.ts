import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { isPaystackConfigured } from "@/lib/paystack";
import { findOrderForReference } from "@/lib/services/orders";
import { startCardPayment } from "@/lib/services/payments";

// Either the reference from the Paystack return page, or the order number plus
// the email it was placed with.
const paySchema = z.union([
  z.object({ reference: z.string().trim().min(1) }),
  z.object({ orderNumber: z.string().trim().min(1), email: z.string().email() }),
]);

/**
 * POST /api/v1/store/checkout/pay
 * Opens a new Paystack payment for an unpaid card order that hasn't expired,
 * so a failed or abandoned payment can be retried without checking out again.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "payment");
    if (limited) return limited;

    if (!isPaystackConfigured()) {
      return apiError("Card payments are unavailable right now. Please try again later.", 503);
    }
    const { data, error } = await parseBody(req, paySchema);
    if (error) return error;

    let order;
    if ("reference" in data!) {
      order = await findOrderForReference(data.reference);
    } else {
      [order] = await db.select().from(orders).where(eq(orders.orderNumber, data!.orderNumber)).limit(1);
    }
    if (!order) return apiError("Order not found", 404);

    // The email the customer paid with: their account email, else the one given at checkout.
    let email = order.guestEmail;
    if (order.userId) {
      const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1);
      email = owner?.email ?? email;
    }
    if ("email" in data!) {
      const session = await getSession(req);
      const ownsOrder = session?.user?.id && session.user.id === order.userId;
      if (!ownsOrder && data.email.toLowerCase() !== (email ?? "").toLowerCase()) {
        return apiError("Order not found", 404);
      }
    }

    if (order.paymentStatus === "paid") return apiError("This order is already paid", 409);
    if (order.paymentMethod !== "paystack") return apiError("This order is paid on delivery", 409);
    if (order.status !== "pending" || (order.expiresAt && order.expiresAt < new Date())) {
      return apiError("This order has expired. Please check out again.", 410);
    }
    if (!email) return apiError("This order has no email address for payment", 409);

    const payment = await startCardPayment(order, email);
    return apiSuccess({ orderNumber: order.orderNumber, payment });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/checkout/pay error:", err);
    return apiError("We couldn't open the card payment page. Please try again.", 502);
  }
}
