import type { CartData } from "@/types";

const BASE = "/api/v1/store/cart";

function getHeaders(guestToken?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (guestToken) {
    headers["x-guest-token"] = guestToken;
  }
  return headers;
}

export async function fetchCart(guestToken?: string | null): Promise<CartData> {
  const res = await fetch(BASE, {
    headers: getHeaders(guestToken),
  });
  if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Cart fetch error");
  return json.data as CartData;
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

  const res = await fetch(BASE, {
    method: "POST",
    headers: getHeaders(guestToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cart action failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Cart action error");
  return json.data as CartData;
}
