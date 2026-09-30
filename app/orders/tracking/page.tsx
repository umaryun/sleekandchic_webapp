"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, Truck, CheckCircle, Search, CreditCard, XCircle, Loader2, MapPin } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";

interface TrackedOrder {
  orderNumber: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "paystack" | "cod" | null;
  shippingMethod: "standard" | "express" | null;
  subtotal: number | null;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  createdAt: string;
  paidAt: string | null;
  firstName: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  items: { name: string; price: number; quantity: number; color: string | null; size: string | null }[];
}

const STEPS = [
  { key: "placed", label: "Order placed", Icon: Package },
  { key: "confirmed", label: "Confirmed", Icon: CreditCard },
  { key: "shipped", label: "On its way", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle },
] as const;

/** How far along the four steps an order is (0-based). */
function progress(order: TrackedOrder) {
  switch (order.status) {
    case "delivered":
      return 3;
    case "shipped":
      return 2;
    case "paid":
    case "processing":
      return 1;
    default:
      return 0;
  }
}

function headline(order: TrackedOrder) {
  if (order.status === "cancelled") return "This order was cancelled";
  if (order.status === "delivered") return "Delivered";
  if (order.status === "shipped") return "On its way to you";
  if (order.status === "paid" || order.status === "processing") return "We're preparing your order";
  if (order.paymentMethod === "paystack" && order.paymentStatus !== "paid") return "Waiting for your payment";
  return "Order received. We'll call you to confirm delivery.";
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

async function lookup(orderNumber: string, contact: string) {
  const qs = new URLSearchParams({ order_number: orderNumber });
  if (contact) qs.set("contact", contact);
  const res = await fetch(`/api/v1/store/orders/tracking?${qs}`, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error || "We couldn't look up that order. Please try again.");
  return json.data as TrackedOrder;
}

function TrackingContent() {
  const params = useSearchParams();
  const linkedOrder = params.get("order") ?? params.get("orderNumber") ?? params.get("ref") ?? "";

  const [orderNum, setOrderNum] = useState(linkedOrder);
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  // Signed-in customers following a link from their account see the order
  // straight away; anyone else is asked for the email or phone they used.
  useEffect(() => {
    if (!linkedOrder) return;
    let cancelled = false;
    lookup(linkedOrder, "")
      .then((found) => !cancelled && setOrder(found))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [linkedOrder]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSearching(true);
    try {
      setOrder(await lookup(orderNum.trim(), contact.trim()));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "We couldn't look up that order.");
    } finally {
      setSearching(false);
    }
  };

  const step = order ? progress(order) : 0;
  const cancelled = order?.status === "cancelled";

  return (
    <div className="max-w-[960px] mx-auto my-12 px-4">
      <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 sm:p-10 mb-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="text-center mb-7">
          <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-2">Track your order</h1>
          <p className="text-sm text-[#777] leading-relaxed">
            Enter your order number and the email or phone number you used at checkout.
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label htmlFor="track-order" className="block text-xs font-bold text-[#666] uppercase tracking-wide mb-1.5">
              Order number
            </label>
            <input
              id="track-order"
              type="text"
              required
              placeholder="SC-…"
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#1a1a1a] uppercase"
            />
          </div>
          <div>
            <label htmlFor="track-contact" className="block text-xs font-bold text-[#666] uppercase tracking-wide mb-1.5">
              Email or phone
            </label>
            <input
              id="track-contact"
              type="text"
              required
              autoComplete="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Track order
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3.5 px-4 py-3 bg-[#fff5f5] border border-[#ffc0c0] rounded text-[13px] text-[#c0392b] font-medium">
            {error}
          </p>
        )}
      </div>

      {order && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#888] mb-1">Order {order.orderNumber}</p>
              <p className="text-lg font-extrabold text-[#1a1a1a]">{headline(order)}</p>
            </div>
            <div className="text-sm text-[#555]">
              Placed {dateFmt(order.createdAt)}
              {order.shippingMethod && ` · ${order.shippingMethod === "express" ? "Express" : "Standard"} delivery`}
            </div>
          </div>

          {cancelled ? (
            <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 flex items-start gap-3 text-sm text-[#555]">
              <XCircle className="text-[#b42318] shrink-0" size={22} />
              <p>
                This order won&apos;t be delivered. If you paid and haven&apos;t been refunded, please{" "}
                <Link href="/contact" className="text-[#8a6452] font-semibold">contact us</Link> with your order number.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#f0f0f0] rounded-lg px-4 sm:px-7 py-8">
              <ol className="flex items-start justify-between relative">
                <div className="absolute top-5 left-[12%] right-[12%] h-[3px] bg-[#f0f0f0]" aria-hidden>
                  <div className="h-full bg-[#1a1a1a] transition-all" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
                </div>
                {STEPS.map(({ key, label, Icon }, i) => {
                  const done = i <= step;
                  return (
                    <li key={key} className="flex flex-col items-center gap-2.5 relative z-[1] flex-1" aria-current={i === step ? "step" : undefined}>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          done ? "bg-[#1a1a1a] text-white" : "bg-[#f0f0f0] text-[#aaa] border-2 border-[#ddd]"
                        } ${i === step ? "ring-4 ring-[#1a1a1a]/10" : ""}`}
                      >
                        <Icon size={18} />
                      </div>
                      <span className={`text-xs text-center ${done ? "font-bold text-[#1a1a1a]" : "text-[#999]"}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-[#f0f0f0] rounded-lg p-6">
              <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-4">Items</h2>
              <ul className="flex flex-col gap-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3 text-[13px]">
                    <span>
                      <span className="font-semibold text-[#1a1a1a]">{item.name}</span>
                      <span className="block text-xs text-[#888]">
                        Qty {item.quantity}
                        {(item.color || item.size) && ` · ${[item.color, item.size].filter(Boolean).join(", ")}`}
                      </span>
                    </span>
                    <span className="font-bold shrink-0">{formatNGN(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#f0f0f0] mt-4 pt-3 flex flex-col gap-1.5 text-[13px]">
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-[#28a745]">
                    <span>Discount</span>
                    <span>-{formatNGN(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#666]">
                  <span>Delivery</span>
                  <span>{order.shippingFee === 0 ? "Free" : formatNGN(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-[15px] text-[#1a1a1a]">
                  <span>Total</span>
                  <span>{formatNGN(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 text-[13px] text-[#555]">
                <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-2.5 flex items-center gap-2">
                  <MapPin size={15} /> Delivery
                </h2>
                <p>
                  {order.firstName ? `${order.firstName}, ` : ""}
                  {[order.deliveryCity, order.deliveryState].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 text-[13px] text-[#555]">
                <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-2.5 flex items-center gap-2">
                  <CreditCard size={15} /> Payment
                </h2>
                <p>
                  {order.paymentStatus === "paid"
                    ? `Paid${order.paidAt ? ` on ${dateFmt(order.paidAt)}` : ""}`
                    : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : order.paymentMethod === "cod"
                        ? `${formatNGN(order.totalAmount)} due on delivery (cash or POS)`
                        : "Not paid yet"}
                </p>
              </div>
              <Link
                href="/products"
                className="p-3 bg-[#1a1a1a] text-white no-underline rounded font-bold text-sm text-center hover:bg-[#333] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="Order Tracking" crumbs={[]} />
      <Suspense
        fallback={
          <div className="flex justify-center py-20 text-[#888]">
            <Loader2 className="animate-spin" size={28} />
          </div>
        }
      >
        <TrackingContent />
      </Suspense>
    </ShopLayout>
  );
}
