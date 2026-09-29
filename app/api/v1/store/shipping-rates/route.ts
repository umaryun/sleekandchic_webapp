import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, parseBody, withCors } from "@/lib/api-utils";
import { getShippingQuotesAsync, getDbShippingRates, ZONE_NAMES } from "@/lib/shipping";

/**
 * GET /api/v1/store/shipping-rates
 * Returns all active delivery destinations, zones, base fees and estimates
 */
export async function GET(req: NextRequest) {
  try {
    const ratesMap = await getDbShippingRates();
    const rates = Object.entries(ratesMap).map(([state, info]) => ({
      state,
      zone: info.zone,
      zoneName: ZONE_NAMES[info.zone] || `Zone ${info.zone}`,
      standardBase: info.standardBase,
      expressBase: info.expressBase,
      estimatedDays: info.estimatedDays,
      freeShippingThreshold: info.freeShippingThreshold,
    }));

    const response = apiSuccess({
      rates,
      zones: ZONE_NAMES,
    });
    return withCors(response, req);
  } catch (err) {
    console.error("GET /api/v1/store/shipping-rates error:", err);
    return apiError("Internal server error", 500);
  }
}

const quoteSchema = z.object({
  state: z.string().min(1),
  subtotal: z.number().min(0),
  itemCount: z.number().int().min(1),
});

/**
 * POST /api/v1/store/shipping-rates
 * Returns dynamic shipping quotes (standard + express) for a given state using DB rates
 */
export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, quoteSchema);
    if (error) return error;

    const { state, subtotal, itemCount } = data!;
    const quotes = await getShippingQuotesAsync(state, subtotal, itemCount);

    const response = apiSuccess({
      state,
      quotes,
    });
    return withCors(response, req);
  } catch (err) {
    console.error("POST /api/v1/store/shipping-rates error:", err);
    return apiError("Internal server error", 500);
  }
}
