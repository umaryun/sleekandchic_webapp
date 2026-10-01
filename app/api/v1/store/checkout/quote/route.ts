import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { koboToNaira } from "@/lib/money";
import { findCart, loadCartLines } from "@/lib/services/cart";
import { quoteLines } from "@/lib/services/orders";

const quoteSchema = z.object({
  guestToken: z.string().optional(),
  state: z.string().trim().min(1),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  discountCode: z.string().optional(),
});

/**
 * Prices the current bag for a delivery state, method and promo code. The
 * checkout page shows only these numbers, and placing the order recomputes
 * them the same way.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "quote");
    if (limited) return limited;

    const { data, error } = await parseBody(req, quoteSchema);
    if (error) return error;

    const session = await getSession(req);
    const userId = session?.user?.id || null;
    const guestToken = req.headers.get("x-guest-token") || data!.guestToken || null;

    const cart = await findCart(userId, guestToken);
    const lines = cart ? await loadCartLines(cart.id) : [];
    if (lines.length === 0) return apiError("Your bag is empty", 400);

    const quote = await quoteLines(lines, data!);
    const option = (q: typeof quote.shipping) => ({
      fee: q.fee,
      isFree: q.isFree,
      freeThreshold: q.freeThreshold,
      estimatedDays: q.estimatedDays,
      zone: q.zone,
      zoneName: q.zoneName,
    });

    return apiSuccess({
      subtotal: koboToNaira(quote.subtotalKobo),
      discountAmount: koboToNaira(quote.discountKobo),
      shippingFee: koboToNaira(quote.shippingKobo),
      totalAmount: koboToNaira(quote.totalKobo),
      itemCount: quote.itemCount,
      discountCode: quote.discount?.code ?? null,
      discountError: quote.discountError,
      shippingOptions: {
        standard: option(quote.shippingOptions.standard),
        express: option(quote.shippingOptions.express),
      },
      problems: quote.problems,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/checkout/quote error:", err);
    return apiError("Internal server error", 500);
  }
}
