import { NextRequest } from "next/server";
import { z } from "zod";
import { isNigerianState } from "@/lib/nigeria";
import { apiSuccess, apiError, parseBody, getSession } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { koboToNaira } from "@/lib/money";
import { buyNowSchema, findCart, loadBuyNowLines, loadCartLines } from "@/lib/services/cart";
import { quoteLines, type Quote } from "@/lib/services/orders";

const quoteSchema = z.object({
  guestToken: z.string().optional(),
  state: z.string().trim().refine(isNigerianState, "Choose your state from the list"),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  discountCode: z.string().optional(),
  buyNow: buyNowSchema.optional(),
});

/**
 * Prices the current bag, or a Buy now item, for a delivery state, method and
 * promo code. The checkout page shows only these numbers, and placing the
 * order recomputes them the same way.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "quote");
    if (limited) return limited;

    const { data, error } = await parseBody(req, quoteSchema);
    if (error) return error;

    if (data!.buyNow) {
      const lines = await loadBuyNowLines(data!.buyNow);
      if (lines.length === 0) return apiError("This item is no longer available", 404);
      return quoteResponse(await quoteLines(lines, data!));
    }

    const session = await getSession(req);
    const userId = session?.user?.id || null;
    const guestToken = req.headers.get("x-guest-token") || data!.guestToken || null;
    const cart = await findCart(userId, guestToken);
    const lines = cart ? await loadCartLines(cart.id) : [];
    if (lines.length === 0) return apiError("Your bag is empty", 400);
    return quoteResponse(await quoteLines(lines, data!));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/checkout/quote error:", err);
    return apiError("Internal server error", 500);
  }
}

function quoteResponse(quote: Quote) {
  const option = (q: Quote["shipping"]) => ({
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
}
