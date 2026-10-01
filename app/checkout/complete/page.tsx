"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Loader2, Package } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface VerifiedOrder {
  status: "paid" | "unpaid";
  orderNumber: string;
  orderStatus: string;
  canRetryPayment: boolean;
  firstName: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  shippingMethod: "standard" | "express" | null;
  subtotal: number | null;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  items: { name: string; quantity: number; size: string | null; color: string | null; price: number }[];
}

type View =
  | { kind: "checking" }
  | { kind: "result"; order: VerifiedOrder }
  | { kind: "error"; message: string };

// Bank transfers can take a moment to settle, so an unpaid result is checked
// again a few times before we ask the shopper to retry.
const RECHECKS = 4;
const RECHECK_DELAY_MS = 3000;

async function verify(reference: string): Promise<View> {
  try {
    const res = await fetch(`/api/v1/store/checkout/verify?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { kind: "error", message: json?.error || "We couldn't confirm your payment. Refresh this page in a moment." };
    }
    return { kind: "result", order: json.data as VerifiedOrder };
  } catch {
    return { kind: "error", message: "We couldn't reach the store. Check your connection and refresh this page." };
  }
}

function CompleteContent() {
  const params = useSearchParams();
  // Paystack appends both ?trxref= and ?reference= to the return URL.
  const reference = params.get("reference") || params.get("trxref");
  const { refresh } = useCart();
  const [view, setView] = useState<View>(
    reference ? { kind: "checking" } : { kind: "error", message: "This page needs a payment reference from Paystack." }
  );
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    (async () => {
      for (let attempt = 0; !cancelled; attempt++) {
        const next = await verify(reference);
        if (cancelled) return;
        if (
          next.kind === "result" &&
          next.order.status === "unpaid" &&
          next.order.canRetryPayment &&
          attempt < RECHECKS
        ) {
          await new Promise((resolve) => setTimeout(resolve, RECHECK_DELAY_MS));
          continue;
        }
        setView(next);
        if (next.kind === "result" && next.order.status === "paid") await refresh();
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference, refresh]);

  const retry = async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/v1/store/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.payment?.authorization_url) {
        window.location.href = json.data.payment.authorization_url;
        return;
      }
      setView({ kind: "error", message: json?.error || "We couldn't open the payment page. Please try again shortly." });
    } finally {
      setRetrying(false);
    }
  };

  if (view.kind === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center text-[#666]">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">Confirming your payment with Paystack…</p>
      </div>
    );
  }

  if (view.kind === "error") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle size={40} className="mx-auto mb-4 text-[#b42318]" />
        <h1 className="text-xl font-extrabold text-[#1a1a1a] mb-2">We couldn&apos;t confirm this payment</h1>
        <p className="text-sm text-[#666] mb-6">{view.message}</p>
        <p className="text-sm text-[#666] mb-6">
          If money has left your account, don&apos;t pay again. Contact us with your Paystack receipt and we&apos;ll sort it out.
        </p>
        <Link href="/contact" className="inline-block rounded-md bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white no-underline">
          Contact us
        </Link>
      </div>
    );
  }

  const { order } = view;

  if (order.status === "unpaid") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle size={40} className="mx-auto mb-4 text-[#b54708]" />
        <h1 className="text-xl font-extrabold text-[#1a1a1a] mb-2">Payment not completed</h1>
        <p className="text-sm text-[#666] mb-6">
          Order {order.orderNumber} is saved, but Paystack hasn&apos;t confirmed a payment for it.
          {order.canRetryPayment
            ? " Your items are held for a short while, so you can try again now."
            : " The order has expired and its items were released. Please check out again."}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {order.canRetryPayment ? (
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="rounded-md bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {retrying ? "Opening Paystack…" : `Try payment again — ${formatNGN(order.totalAmount)}`}
            </button>
          ) : (
            <Link href="/cart" className="rounded-md bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white no-underline">
              Back to your bag
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 sm:p-12 text-center shadow-xs max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#dcf5e7] flex items-center justify-center mx-auto mb-5">
        <Check size={36} color="#28a745" />
      </div>
      <h1 className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] mb-2">Payment received</h1>
      <p className="text-sm sm:text-base text-[#666] mb-7">
        Thank you{order.firstName ? `, ${order.firstName}` : ""}. We&apos;re preparing order {order.orderNumber} for delivery.
      </p>

      <div className="bg-[#f9f9f9] rounded-lg p-4 sm:p-6 mb-8 text-left w-full max-w-md mx-auto border border-[#eee] text-[13px]">
        <ul className="mb-3 space-y-1.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="text-[#333]">
                {item.quantity} × {item.name}
                {(item.size || item.color) && (
                  <span className="text-[#6b6b6b]"> ({[item.color, item.size].filter(Boolean).join(", ")})</span>
                )}
              </span>
              <span className="font-semibold shrink-0">{formatNGN(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-[#28a745] mb-1.5">
            <span>Discount</span>
            <span>-{formatNGN(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1.5">
          <span className="text-[#777]">
            Delivery{order.deliveryCity ? ` to ${order.deliveryCity}, ${order.deliveryState}` : ""}
          </span>
          <span>{order.shippingFee === 0 ? "Free" : formatNGN(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between pt-3 mt-2 border-t border-[#e5e5e5]">
          <span className="text-sm font-bold">Paid</span>
          <span className="text-base font-extrabold text-[#1a1a1a]">{formatNGN(order.totalAmount)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href={`/orders/tracking?order=${encodeURIComponent(order.orderNumber)}`}
          className="px-6 py-3.5 bg-[#1a1a1a] text-white no-underline rounded-md font-bold text-sm flex items-center justify-center gap-2"
        >
          <Package size={16} /> Track this order
        </Link>
        <Link
          href="/products"
          className="px-6 py-3.5 border-2 border-[#1a1a1a] text-[#1a1a1a] no-underline rounded-md font-bold text-sm flex items-center justify-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="Order confirmation" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        <Suspense
          fallback={
            <div className="flex justify-center py-20 text-[#6b6b6b]">
              <Loader2 className="animate-spin" size={28} />
            </div>
          }
        >
          <CompleteContent />
        </Suspense>
      </div>
    </ShopLayout>
  );
}
