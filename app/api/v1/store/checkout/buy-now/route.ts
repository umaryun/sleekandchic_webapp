import { NextRequest } from "next/server";
import { apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { buyNowSchema, linesPayload, loadBuyNowLines } from "@/lib/services/cart";

/**
 * The item a Buy now checkout is for, shaped like a bag line so the checkout
 * page can show it. Buy now never adds to the bag.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "quote");
    if (limited) return limited;

    const { data, error } = await parseBody(req, buyNowSchema);
    if (error) return error;

    const lines = await loadBuyNowLines(data!);
    if (lines.length === 0) return apiError("This item is no longer available", 404);
    return apiSuccess(await linesPayload(lines));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/checkout/buy-now error:", err);
    return apiError("Internal server error", 500);
  }
}
