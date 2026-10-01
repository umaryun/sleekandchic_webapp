import { env } from "@/lib/env";

const API = "https://api.paystack.co";

export class PaystackError extends Error {}

export function isPaystackConfigured() {
  return Boolean(env.PAYSTACK_SECRET_KEY);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY) throw new PaystackError("Paystack is not configured");
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new PaystackError(`Paystack request failed: ${err instanceof Error ? err.message : err}`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    throw new PaystackError(`Paystack ${path} failed (${res.status}): ${body?.message ?? "no response body"}`);
  }
  return body.data as T;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const data = await call<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    }
  );
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export interface VerifiedTransaction {
  id: number;
  status: string; // "success" | "failed" | "abandoned" | "ongoing" | ...
  reference: string;
  amount: number; // kobo
  currency: string;
  paid_at: string | null;
  metadata: { orderId?: string; orderNumber?: string } | null;
}

export async function verifyTransaction(reference: string) {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** A fresh reference per payment attempt; Paystack rejects reused references. */
export function paymentReference(orderNumber: string) {
  return `${orderNumber}-${Date.now().toString(36).toUpperCase()}`;
}
