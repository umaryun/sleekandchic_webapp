import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { getShippingQuotes } from "@/lib/shipping";

const quoteSchema = z.object({
  state: z.string().min(1),
  subtotal: z.number().min(0),
  itemCount: z.number().int().min(1),
});

/**
 * POST /api/v1/store/shipping-rates
 * Returns dynamic shipping quotes (standard + express) for a given state
 */
export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, quoteSchema);
    if (error) return error;

    const { state, subtotal, itemCount } = data!;
    const quotes = getShippingQuotes(state, subtotal, itemCount);

    return apiSuccess({
      state,
      quotes,
    });
  } catch (err) {
    console.error("POST /api/v1/store/shipping-rates error:", err);
    return apiError("Internal server error", 500);
  }
}
