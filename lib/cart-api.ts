import type { CartData } from "@/types";

const BASE = "/api/v1/store/cart";

function getHeaders(guestToken?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (guestToken) {
    headers["x-guest-token"] = guestToken;
  }
  return headers;
}

/** Error carrying the server's own message, e.g. "Only 2 left of …". */
export class CartError extends Error {}

async function readCart(res: Response): Promise<CartData> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new CartError(json?.error || "We couldn't update your bag. Please try again.");
  }
  return json.data as CartData;
}

export async function fetchCart(guestToken?: string | null): Promise<CartData> {
  return readCart(await fetch(BASE, { headers: getHeaders(guestToken), cache: "no-store" }));
}

/** Moves the guest bag into the signed-in customer's bag and returns the result. */
export async function mergeCart(guestToken: string): Promise<CartData> {
  return readCart(
    await fetch(`${BASE}/merge`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ guestToken }),
    })
  );
}

export async function cartAction(
  action: "add" | "update" | "remove",
  productId: string,
  guestToken?: string | null,
  variantId?: string | null,
  quantity?: number
): Promise<CartData> {
  const body: Record<string, unknown> = { action, productId };
  if (variantId) body.variantId = variantId;
  if (quantity !== undefined) body.quantity = quantity;

  return readCart(
    await fetch(BASE, {
      method: "POST",
      headers: getHeaders(guestToken),
      body: JSON.stringify(body),
    })
  );
}
