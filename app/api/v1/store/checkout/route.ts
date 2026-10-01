import { NextRequest } from "next/server";
import { z } from "zod";
import { isNigerianState } from "@/lib/nigeria";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { koboToNaira } from "@/lib/money";
import { isPaystackConfigured } from "@/lib/paystack";
import { CheckoutError, expireStaleOrders, placeOrder } from "@/lib/services/orders";
import { startCardPayment } from "@/lib/services/payments";
import { afterResponse, isEmailConfigured } from "@/lib/email/send";
import { notifyNewOrder } from "@/lib/email/notify";

const checkoutSchema = z.object({
  guestToken: z.string().optional(),
  guestEmail: z.string().email("Enter a valid email address").optional(),
  shippingAddress: z.object({
    street: z.string().trim().min(1, "Enter your street address"),
    city: z.string().trim().min(1, "Enter your city or town"),
    state: z.string().trim().refine(isNigerianState, "Choose your state from the list"),
    country: z.string().default("Nigeria"),
    postalCode: z.string().optional(),
    phone: z.string().trim().min(7, "Enter a phone number the courier can call"),
    firstName: z.string().trim().min(1, "Enter your first name"),
    lastName: z.string().trim().min(1, "Enter your last name"),
  }),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["paystack", "cod"]).default("paystack"),
  discountCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "checkout");
    if (limited) return limited;

    const { data, error } = await parseBody(req, checkoutSchema);
    if (error) return error;

    const session = await getSession(req);
    const userId = session?.user?.id || null;
    const guestToken = req.headers.get("x-guest-token") || data!.guestToken || null;
    const contactEmail = userId ? session!.user.email : data!.guestEmail;

    if (!contactEmail) {
      return apiError("Enter your email address so we can send your order confirmation", 400);
    }
    if (data!.paymentMethod === "paystack" && !isPaystackConfigured()) {
      return apiError("Card payments are unavailable right now. Choose Pay on Delivery or try again later.", 503);
    }

    // Free stock held by card orders that were never paid.
    await expireStaleOrders().catch((err) => console.error("expireStaleOrders failed:", err));

    const { order, quote } = await placeOrder({
      userId,
      guestToken,
      guestEmail: data!.guestEmail ?? null,
      shippingAddress: data!.shippingAddress,
      shippingMethod: data!.shippingMethod,
      paymentMethod: data!.paymentMethod,
      discountCode: data!.discountCode,
    });

    const summary = {
      orderNumber: order.orderNumber,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      subtotal: koboToNaira(quote.subtotalKobo),
      discountAmount: koboToNaira(quote.discountKobo),
      shippingFee: koboToNaira(quote.shippingKobo),
      totalAmount: koboToNaira(quote.totalKobo),
    };

    if (data!.paymentMethod === "cod") {
      // Card orders are announced once paid (webhook / return page).
      afterResponse(() => notifyNewOrder(order.id));
      return apiSuccess({ ...summary, confirmationEmail: isEmailConfigured() ? contactEmail : null });
    }

    try {
      const payment = await startCardPayment(order, contactEmail);
      return apiSuccess({ ...summary, payment });
    } catch (err) {
      console.error(`Paystack initialize failed for ${order.orderNumber}:`, err);
      // The order stays pending and holds its stock until it expires, so the
      // customer can retry payment without checking out again.
      return Response.json(
        {
          success: false,
          error: `We couldn't open the card payment page. Your order ${order.orderNumber} is saved; try paying again.`,
          data: { ...summary, canRetryPayment: true },
        },
        { status: 502 }
      );
    }
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof CheckoutError) return apiError(err.message, err.status);
    console.error("POST /api/v1/store/checkout error:", err);
    return apiError("Internal server error", 500);
  }
}
