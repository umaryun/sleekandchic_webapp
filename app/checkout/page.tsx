"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  CreditCard,
  Truck,
  Package,
  MapPin,
  Lock,
  AlertCircle,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const STEPS = ["Shipping & Delivery", "Payment Method", "Order Placed"] as const;
type Step = (typeof STEPS)[number];
type ShippingMethod = "standard" | "express";
type PaymentMethod = "paystack" | "cod";

const NIGERIAN_STATES = [
  "Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; badge: string }[] = [
  {
    id: "paystack",
    label: "Paystack (Cards, Bank Transfer, USSD)",
    sub: "Pay securely via your card, bank app, or USSD code",
    badge: "Instant",
  },
  {
    id: "cod",
    label: "Pay on Delivery (Cash / POS)",
    sub: "Pay with Cash or Card POS when your item arrives",
    badge: "Local",
  },
];

interface ShippingOption {
  fee: number;
  isFree: boolean;
  freeThreshold: number;
  estimatedDays: string;
  zone: string;
  zoneName: string;
}

interface Quote {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  itemCount: number;
  discountCode: string | null;
  discountError: string | null;
  shippingOptions: Record<ShippingMethod, ShippingOption>;
  problems: string[];
}

interface PlacedOrder {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}

function guestToken() {
  try {
    return localStorage.getItem("sc_guest_token");
  } catch {
    return null;
  }
}

function guestHeaders(): HeadersInit {
  const token = guestToken();
  return { "Content-Type": "application/json", ...(token ? { "x-guest-token": token } : {}) };
}

/** Prices the bag on the server; every total on this page comes from here. */
async function fetchQuote(input: { state: string; shippingMethod: ShippingMethod; discountCode: string | null }) {
  const res = await fetch("/api/v1/store/checkout/quote", {
    method: "POST",
    headers: guestHeaders(),
    body: JSON.stringify({ ...input, discountCode: input.discountCode ?? undefined }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error || "We couldn't price your order. Please try again.");
  return json.data as Quote;
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #ddd",
  borderRadius: "5px",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
} as const;
const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" } as const;

export default function CheckoutPage() {
  const { items, subtotal: bagSubtotal, loading: bagLoading, refresh } = useCart();

  const [step, setStep] = useState<Step>("Shipping & Delivery");
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryOrderNumber, setRetryOrderNumber] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // The quote is keyed by everything that changes the price; a quote for an
  // older key is ignored, so stale totals are never shown.
  const itemsKey = items.map((i) => `${i.id}:${i.quantity}`).join(",");
  const quoteKey =
    shipping.state && items.length > 0 ? JSON.stringify([shipping.state, shippingMethod, appliedCode, itemsKey]) : null;
  const [quoteState, setQuoteState] = useState<{ key: string; quote: Quote | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!quoteKey) return;
    const [state, method, code] = JSON.parse(quoteKey) as [string, ShippingMethod, string | null];
    let cancelled = false;
    fetchQuote({ state, shippingMethod: method, discountCode: code })
      .then((quote) => !cancelled && setQuoteState({ key: quoteKey, quote, error: null }))
      .catch((err: Error) => !cancelled && setQuoteState({ key: quoteKey, quote: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [quoteKey]);

  const quote = quoteState?.key === quoteKey ? quoteState.quote : null;
  const quoteError = quoteState?.key === quoteKey ? quoteState.error : null;
  const quoteLoading = quoteKey !== null && quoteState?.key !== quoteKey;
  const activeOption = quote?.shippingOptions[shippingMethod];
  const problems = quote?.problems ?? [];
  const totalItemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const stepIndex = STEPS.indexOf(step);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    if (!shipping.state) {
      setCouponError("Choose your delivery state first, then apply the code.");
      return;
    }
    setCouponError("");
    setCheckingCoupon(true);
    try {
      const checked = await fetchQuote({ state: shipping.state, shippingMethod, discountCode: code });
      if (checked.discountError) setCouponError(checked.discountError);
      else setAppliedCode(checked.discountCode);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "We couldn't check that code.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCode(null);
    setCouponInput("");
    setCouponError("");
  };

  const goToPaystack = (url: string) => {
    // The bag stays until payment is confirmed on the return page.
    window.location.href = url;
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setRetryOrderNumber(null);

    try {
      const res = await fetch("/api/v1/store/checkout", {
        method: "POST",
        headers: guestHeaders(),
        body: JSON.stringify({
          guestEmail: shipping.email.trim(),
          guestToken: guestToken() || undefined,
          shippingAddress: {
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            phone: shipping.phone,
            street: shipping.address,
            city: shipping.city,
            state: shipping.state,
            country: "Nigeria",
          },
          shippingMethod,
          paymentMethod,
          discountCode: appliedCode ?? undefined,
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.status === 502 && json?.data?.canRetryPayment) {
        setRetryOrderNumber(json.data.orderNumber);
        setErrorMessage(json.error);
        return;
      }
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.error || "We couldn't place your order. Please try again.");
        if (res.status === 409) await refresh();
        return;
      }

      if (json.data.payment?.authorization_url) {
        goToPaystack(json.data.payment.authorization_url);
        return;
      }

      setPlaced({
        orderNumber: json.data.orderNumber,
        totalAmount: json.data.totalAmount,
        paymentMethod: json.data.paymentMethod,
      });
      setStep("Order Placed");
      await refresh();
    } catch {
      setErrorMessage("We couldn't reach the store. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryPayment = async () => {
    if (!retryOrderNumber) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/v1/store/checkout/pay", {
        method: "POST",
        headers: guestHeaders(),
        body: JSON.stringify({ orderNumber: retryOrderNumber, email: shipping.email.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.payment?.authorization_url) {
        goToPaystack(json.data.payment.authorization_url);
        return;
      }
      setErrorMessage(json?.error || "We still couldn't open the payment page. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isShippingValid =
    Boolean(shipping.firstName.trim()) &&
    Boolean(shipping.lastName.trim()) &&
    /^\S+@\S+\.\S+$/.test(shipping.email.trim()) &&
    shipping.phone.replace(/\D/g, "").length >= 10 &&
    Boolean(shipping.address.trim()) &&
    Boolean(shipping.city.trim()) &&
    Boolean(shipping.state) &&
    Boolean(activeOption) &&
    problems.length === 0;

  const field = (key: keyof typeof shipping) => ({
    value: shipping[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setShipping({ ...shipping, [key]: e.target.value }),
    style: inputStyle,
  });

  const shownSubtotal = quote?.subtotal ?? bagSubtotal;

  return (
    <ShopLayout>
      <PageBreadcrumb title="Checkout" crumbs={[{ label: "Cart", href: "/cart" }]} />

      <div style={{ width: "100%", maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {bagLoading && !placed ? (
          <div className="flex justify-center py-20 text-[#888]">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : items.length === 0 && !placed ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <ShoppingBag size={56} color="#ccc" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>Your cart is empty</h2>
            <p style={{ color: "#777", marginBottom: "24px" }}>You don&apos;t have any items in your cart to checkout.</p>
            <Link
              href="/products"
              style={{ padding: "12px 28px", background: "#1a1a1a", color: "#fff", borderRadius: "4px", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-9 items-start">
            {/* Left Column — Checkout Process */}
            <div className="order-2 lg:order-1">
              {/* Progress Bar */}
              <div className="flex items-center justify-between mb-6 sm:mb-8 bg-white p-3.5 sm:p-5 rounded-lg border border-[#f0f0f0] shadow-xs">
                {STEPS.map((s, i) => (
                  <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : "flex-initial"}`}>
                    <button
                      type="button"
                      onClick={() => i < stepIndex && !placed && setStep(s)}
                      className={`flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 p-0 ${i < stepIndex && !placed ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                        style={{
                          background: i < stepIndex ? "#28a745" : i === stepIndex ? "#1a1a1a" : "#eee",
                          color: i <= stepIndex ? "#fff" : "#999",
                        }}
                      >
                        {i < stepIndex ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${i === stepIndex ? "font-bold text-[#1a1a1a]" : i < stepIndex ? "text-[#28a745]" : "text-[#999]"} hidden sm:inline`}>
                        {s}
                      </span>
                      <span className={`text-[11px] font-medium ${i === stepIndex ? "font-bold text-[#1a1a1a]" : i < stepIndex ? "text-[#28a745]" : "text-[#999]"} sm:hidden inline`}>
                        {s === "Shipping & Delivery" ? "Shipping" : s === "Payment Method" ? "Payment" : "Placed"}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-[2px] mx-1.5 sm:mx-3 transition-colors" style={{ background: i < stepIndex ? "#28a745" : "#eee" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center gap-2.5 mb-5 rounded-md border border-[#f8b4b4] bg-[#fdf2f2] px-4 py-3.5 text-sm text-[#981b1b]"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="flex-1 min-w-0">{errorMessage}</span>
                  {retryOrderNumber && (
                    <button
                      type="button"
                      onClick={retryPayment}
                      disabled={isSubmitting}
                      className="rounded bg-[#1a1a1a] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Opening…" : "Try payment again"}
                    </button>
                  )}
                </div>
              )}

              {/* Items that can't be bought as they are */}
              {problems.length > 0 && (
                <div role="alert" className="mb-5 rounded-md border border-[#f3d38b] bg-[#fffaeb] px-4 py-3.5 text-sm text-[#7a5200]">
                  <p className="font-bold mb-1">Some items in your bag need attention</p>
                  <ul className="list-disc pl-5">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <Link href="/cart" className="mt-2 inline-block font-semibold text-[#7a5200] underline">
                    Update your bag
                  </Link>
                </div>
              )}

              {/* ── STEP 1: Shipping & Delivery ── */}
              {step === "Shipping & Delivery" && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-6 pb-3.5 border-b border-[#f0f0f0]">
                    <MapPin size={20} color="#1a1a1a" className="shrink-0" />
                    <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">Delivery Address (Nigeria)</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="co-first" style={labelStyle}>First Name *</label>
                      <input id="co-first" type="text" autoComplete="given-name" {...field("firstName")} />
                    </div>
                    <div>
                      <label htmlFor="co-last" style={labelStyle}>Last Name *</label>
                      <input id="co-last" type="text" autoComplete="family-name" {...field("lastName")} />
                    </div>
                    <div>
                      <label htmlFor="co-email" style={labelStyle}>Email Address *</label>
                      <input id="co-email" type="email" autoComplete="email" placeholder="you@example.com" {...field("email")} />
                    </div>
                    <div>
                      <label htmlFor="co-phone" style={labelStyle}>Phone Number *</label>
                      <input id="co-phone" type="tel" autoComplete="tel" placeholder="0803 000 0000" {...field("phone")} />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="co-street" style={labelStyle}>Street Address *</label>
                      <input id="co-street" type="text" autoComplete="street-address" placeholder="House number and street" {...field("address")} />
                    </div>
                    <div>
                      <label htmlFor="co-city" style={labelStyle}>City / Town *</label>
                      <input id="co-city" type="text" autoComplete="address-level2" {...field("city")} />
                    </div>
                    <div>
                      <label htmlFor="co-state" style={labelStyle}>State *</label>
                      <select id="co-state" autoComplete="address-level1" {...field("state")} style={{ ...inputStyle, background: "#fff" }}>
                        <option value="" disabled>
                          Choose your state
                        </option>
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delivery options, priced by the server */}
                  <div className="my-7">
                    <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] flex items-center gap-2 mb-3.5">
                      <Truck size={18} color="#1a1a1a" /> Choose Delivery Option
                    </h3>
                    {!shipping.state ? (
                      <p className="text-sm text-[#777]">Choose your state to see delivery options and prices.</p>
                    ) : quoteError ? (
                      <p role="alert" className="text-sm text-[#981b1b]">{quoteError}</p>
                    ) : !quote ? (
                      <p className="text-sm text-[#777] flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Calculating delivery…
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {(["standard", "express"] as const).map((id) => {
                          const option = quote.shippingOptions[id];
                          return (
                            <label
                              key={id}
                              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 border-2 rounded-md cursor-pointer transition-all gap-2 sm:gap-4 ${
                                shippingMethod === id ? "border-[#1a1a1a] bg-[#faf9f8]" : "border-[#e8e8e8] bg-white"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="shipping"
                                  value={id}
                                  checked={shippingMethod === id}
                                  onChange={() => setShippingMethod(id)}
                                  className="accent-[#1a1a1a] w-4 h-4 mt-0.5 shrink-0"
                                />
                                <div>
                                  <p className="text-sm font-bold text-[#1a1a1a]">
                                    {id === "standard" ? "Standard Delivery" : "Express Delivery"}
                                  </p>
                                  <p className="text-xs text-[#777]">
                                    Est. {option.estimatedDays} to {shipping.state}
                                  </p>
                                  {id === "standard" && !option.isFree && (
                                    <p className="text-[11px] text-[#888] mt-0.5">
                                      Free standard delivery on orders over {formatNGN(option.freeThreshold)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm font-extrabold self-end sm:self-center ml-7 sm:ml-0 text-[#1a1a1a]">
                                {option.isFree ? <span className="text-[#28a745]">Free</span> : formatNGN(option.fee)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {totalItemsCount > 3 && quote && (
                      <p className="text-[11px] text-[#888] mt-2 flex items-center gap-1">
                        <Package size={12} /> Delivery includes ₦200 handling for each item after the third.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("Payment Method")}
                    disabled={!isShippingValid || quoteLoading}
                    className="w-full py-3.5 text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 transition-colors bg-[#1a1a1a] disabled:bg-[#d0d0d0] disabled:cursor-not-allowed cursor-pointer"
                  >
                    Proceed to Payment <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* ── STEP 2: Payment Method ── */}
              {step === "Payment Method" && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-6 pb-3.5 border-b border-[#f0f0f0]">
                    <CreditCard size={20} color="#1a1a1a" className="shrink-0" />
                    <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">Select Payment Method</h2>
                  </div>

                  <div className="flex flex-col gap-3 mb-7">
                    {PAYMENT_METHODS.map(({ id, label, sub, badge }) => (
                      <label
                        key={id}
                        className={`flex items-start gap-3 p-3.5 sm:p-4 border-2 rounded-md cursor-pointer transition-all ${
                          paymentMethod === id ? "border-[#1a1a1a] bg-[#faf9f8]" : "border-[#e8e8e8] bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={id}
                          checked={paymentMethod === id}
                          onChange={() => setPaymentMethod(id)}
                          className="accent-[#1a1a1a] w-4 h-4 mt-0.5 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-[#1a1a1a]">{label}</p>
                            <span className="text-[10px] font-bold bg-[#f0f0f0] text-[#555] px-1.5 py-0.5 rounded">{badge}</span>
                          </div>
                          <p className="text-xs text-[#777] mt-0.5">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "paystack" && (
                    <div className="p-4 bg-[#f8fafc] rounded-md border border-[#e2e8f0] mb-7 flex items-center gap-3">
                      <ShieldCheck size={24} color="#2563eb" className="shrink-0" />
                      <p className="text-xs sm:text-sm text-[#334155] m-0">
                        You&apos;ll pay on Paystack&apos;s secure page, then come back here for your confirmation.
                      </p>
                    </div>
                  )}
                  {paymentMethod === "cod" && (
                    <div className="p-4 bg-[#faf9f8] rounded-md border border-[#e8e1dc] mb-7">
                      <p className="text-xs sm:text-sm text-[#5a4a42] font-semibold m-0">
                        Pay with cash or card POS when your order arrives. We&apos;ll call {shipping.phone || "you"} to arrange delivery.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("Shipping & Delivery")}
                      className="w-full sm:w-auto px-6 py-3.5 bg-[#f5f5f5] text-[#555] font-semibold text-sm rounded-md hover:bg-[#eaeaea] transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting || !quote || quoteLoading || problems.length > 0}
                      className="flex-1 w-full py-3.5 bg-[#1a1a1a] disabled:bg-[#888] text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <Lock size={16} />{" "}
                      {isSubmitting
                        ? "Placing your order…"
                        : quote
                          ? `${paymentMethod === "paystack" ? "Pay" : "Place Order"} — ${formatNGN(quote.totalAmount)}`
                          : "Place Order"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Order Confirmation (pay on delivery) ── */}
              {step === "Order Placed" && placed && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 sm:p-12 text-center shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-[#dcf5e7] flex items-center justify-center mx-auto mb-5">
                    <Check size={36} color="#28a745" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] mb-2">Order placed</h2>
                  <p className="text-sm sm:text-base text-[#666] mb-7">
                    Thank you, {shipping.firstName}. We&apos;ll call {shipping.phone} to confirm delivery.
                  </p>

                  <div className="bg-[#f9f9f9] rounded-lg p-4 sm:p-6 mb-8 text-left inline-block w-full max-w-md border border-[#eee] text-[13px]">
                    <div className="flex justify-between mb-2.5">
                      <span className="text-[#777]">Order Number</span>
                      <span className="text-sm font-extrabold text-[#1a1a1a]">{placed.orderNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2.5">
                      <span className="text-[#777]">Delivery to</span>
                      <span className="font-semibold text-[#333]">{shipping.city}, {shipping.state}</span>
                    </div>
                    <div className="flex justify-between mb-2.5">
                      <span className="text-[#777]">Payment</span>
                      <span className="font-semibold text-[#333]">Pay on Delivery</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-[#e5e5e5]">
                      <span className="text-sm font-bold">Amount due on delivery</span>
                      <span className="text-base font-extrabold text-[#1a1a1a]">{formatNGN(placed.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/orders/tracking?order=${encodeURIComponent(placed.orderNumber)}`}
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
              )}
            </div>

            {/* Right Column — Order Summary */}
            {!placed && (
              <div className="order-1 lg:order-2 bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-6 lg:sticky lg:top-[90px] shadow-xs h-fit">
                <h3 className="text-base font-bold text-[#1a1a1a] mb-4 pb-3 border-b border-[#f0f0f0]">
                  Order Summary ({totalItemsCount} {totalItemsCount === 1 ? "item" : "items"})
                </h3>

                <div className="flex flex-col gap-3 mb-5 max-h-[280px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || "/placeholder-product.svg"}
                          alt={item.productName || "Product"}
                          className="w-[50px] h-[50px] object-cover rounded border border-[#f0f0f0]"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#1a1a1a] text-white text-[10px] font-bold flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{item.productName}</p>
                        {(item.color || item.size) && (
                          <p className="text-[11px] text-[#888] mt-0.5">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-[#1a1a1a] shrink-0">{formatNGN(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Promo code, checked by the server */}
                <div className="pb-4 mb-4 border-b border-[#f0f0f0]">
                  <label htmlFor="co-promo" className="flex items-center gap-1.5 text-[11px] font-bold text-[#888] uppercase mb-2">
                    <Tag size={12} /> Promo Code
                  </label>
                  {appliedCode ? (
                    <div className="flex items-center justify-between rounded border border-[#b7dfb9] bg-[#edf7ed] px-3 py-2 text-[13px] text-[#1e4620]">
                      <span>
                        <strong>{appliedCode}</strong> applied
                      </span>
                      <button type="button" onClick={removeCoupon} aria-label="Remove promo code" className="text-[#1e4620]">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="co-promo"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        className="flex-1 min-w-0 px-3 py-2 border border-[#ddd] rounded text-[13px] uppercase outline-none"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={checkingCoupon || !couponInput.trim()}
                        className="px-3.5 py-2 bg-[#1a1a1a] text-white rounded text-xs font-bold disabled:opacity-50"
                      >
                        {checkingCoupon ? "Checking…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p role="alert" className="text-[11px] text-[#c0392b] mt-1">{couponError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 mb-4 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Subtotal</span>
                    <span className="font-semibold text-[#1a1a1a]">{formatNGN(shownSubtotal)}</span>
                  </div>
                  {quote && quote.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#28a745]">Discount ({quote.discountCode})</span>
                      <span className="font-semibold text-[#28a745]">-{formatNGN(quote.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#666] flex flex-col">
                      <span>Delivery ({shippingMethod === "express" ? "Express" : "Standard"})</span>
                      {activeOption && <span className="text-[10px] text-[#999]">{activeOption.estimatedDays}</span>}
                    </span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {!quote ? "Choose your state" : quote.shippingFee === 0 ? "Free" : formatNGN(quote.shippingFee)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-3.5 border-y-2 border-[#1a1a1a] mb-4">
                  <span className="text-[15px] font-bold">Total</span>
                  <span className="text-xl font-extrabold text-[#1a1a1a]">
                    {quote ? formatNGN(quote.totalAmount) : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-[#888]">
                  <Lock size={12} /> <span>Card payments are processed by Paystack</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
