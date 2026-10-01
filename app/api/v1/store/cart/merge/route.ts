import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, parseBody, requireAuth } from "@/lib/api-utils";
import { cartPayload, mergeGuestCart } from "@/lib/services/cart";

const mergeSchema = z.object({ guestToken: z.string().min(1).max(200) });

/** Called by the storefront right after sign-in or sign-up; returns the combined bag. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { data, error } = await parseBody(req, mergeSchema);
    if (error) return error;

    const cartId = await mergeGuestCart(session.user.id, data!.guestToken);
    if (!cartId) return apiSuccess({ items: [], subtotal: 0, guestToken: null });
    return apiSuccess(await cartPayload(cartId, null));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/cart/merge error:", err);
    return apiError("Internal server error", 500);
  }
}
