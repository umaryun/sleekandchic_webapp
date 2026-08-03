"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  CreditCard,
  Truck,
  Package,
  MapPin,
  Lock,
  ChevronDown,
  AlertCircle,
  ShoppingBag,
  Tag,
  ShieldCheck,
} from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { getShippingQuotes, type ShippingQuote } from "@/lib/shipping";

const STEPS = ["Shipping & Delivery", "Payment Method", "Order Placed"] as const;
type Step = (typeof STEPS)[number];

const NIGERIAN_STATES = [
  "Abia",
  "Abuja (FCT)",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const PAYMENT_METHODS = [
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

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("Shipping & Delivery");
  const [stateOpen, setStateOpen] = useState(false);
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos",
    country: "Nigeria",
  });

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [payment, setPayment] = useState({ method: "paystack" });
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [placed, setPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderNumber: string;
    totalAmount: number;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
  } | null>(null);

  const { items, subtotal, clearCart } = useCart();
  const totalItemsCount = items.reduce((s, i) => s + i.quantity, 0);

  // Dynamic shipping calculation based on destination state
  const [shippingQuotes, setShippingQuotes] = useState<{
    standard: ShippingQuote;
    express: ShippingQuote;
  } | null>(null);

  const computeQuotes = useCallback(() => {
    if (items.length === 0) return;
    const quotes = getShippingQuotes(shipping.state, subtotal - discountAmount, totalItemsCount);
    setShippingQuotes(quotes);
  }, [shipping.state, subtotal, discountAmount, totalItemsCount, items.length]);

  useEffect(() => {
    computeQuotes();
  }, [computeQuotes]);

  const activeQuote = shippingQuotes?.[shippingMethod];
  const shippingCost = activeQuote?.fee ?? 0;

  const vatTax = Math.round(subtotal * 0.075); // 7.5% Nigerian VAT
  const total = Math.max(
    0,
    subtotal - discountAmount + shippingCost + vatTax
  );

  const stepIndex = STEPS.indexOf(step);

  const applyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    if (couponCode.toUpperCase() === "SAVE10") {
      const calc = Math.round(subtotal * 0.1);
      setDiscountAmount(calc);
      setCouponApplied(true);
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const guestToken =
        typeof window !== "undefined"
          ? localStorage.getItem("sc_guest_token")
          : null;

      const res = await fetch("/api/v1/store/cart/../checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(guestToken ? { "x-guest-token": guestToken } : {}),
        },
        body: JSON.stringify({
          guestEmail: shipping.email,
          guestToken: guestToken || undefined,
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
          paymentMethod: payment.method,
          discountCode: couponApplied ? couponCode : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Order placement failed. Please try again.");
      }

      const data = json.data;

      // Handle Paystack redirect if authorization_url is returned
      if (data.payment?.authorization_url) {
        clearCart();
        window.location.href = data.payment.authorization_url;
        return;
      }

      // Order completed directly (Pay on Delivery or fallback)
      setOrderDetails({
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount || total,
        subtotal: data.subtotal || subtotal,
        shippingFee: data.shippingFee || shippingCost,
        discountAmount: data.discountAmount || discountAmount,
      });

      clearCart();
      setPlaced(true);
      setStep("Order Placed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isShippingValid =
    Boolean(shipping.firstName.trim()) &&
    Boolean(shipping.lastName.trim()) &&
    Boolean(shipping.email.trim()) &&
    Boolean(shipping.phone.trim()) &&
    Boolean(shipping.address.trim()) &&
    Boolean(shipping.city.trim());

  return (
    <ShopLayout>
      <PageBreadcrumb title="Checkout" crumbs={[{ label: "Cart", href: "/cart" }]} />

      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "36px auto",
          padding: "0 16px",
        }}
      >
        {/* Empty state redirect fallback if not placed */}
        {items.length === 0 && !placed ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <ShoppingBag size={56} color="#ccc" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>
              Your cart is empty
            </h2>
            <p style={{ color: "#777", marginBottom: "24px" }}>
              You don&apos;t have any items in your cart to checkout.
            </p>
            <Link
              href="/products"
              style={{
                padding: "12px 28px",
                background: "#f57224",
                color: "#fff",
                borderRadius: "4px",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "14px",
              }}
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
                  <div
                    key={s}
                    className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : "flex-initial"}`}
                  >
                    <button
                      type="button"
                      onClick={() => i < stepIndex && setStep(s)}
                      className={`flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 p-0 ${
                        i < stepIndex ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                        style={{
                          background:
                            i < stepIndex
                              ? "#28a745"
                              : i === stepIndex
                                ? "#f57224"
                                : "#eee",
                          color: i <= stepIndex ? "#fff" : "#999",
                        }}
                      >
                        {i < stepIndex ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          i === stepIndex ? "font-bold text-[#1a1a1a]" : i < stepIndex ? "text-[#28a745]" : "text-[#999]"
                        } hidden sm:inline`}
                      >
                        {s}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          i === stepIndex ? "font-bold text-[#1a1a1a]" : i < stepIndex ? "text-[#28a745]" : "text-[#999]"
                        } sm:hidden inline`}
                      >
                        {s === "Shipping & Delivery" ? "Shipping" : s === "Payment Method" ? "Payment" : "Placed"}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-[2px] mx-1.5 sm:mx-3 transition-colors"
                        style={{
                          background: i < stepIndex ? "#28a745" : "#eee",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div
                  style={{
                    padding: "14px 18px",
                    background: "#fdf2f2",
                    border: "1px solid #f8b4b4",
                    borderRadius: "6px",
                    color: "#981b1b",
                    fontSize: "14px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <AlertCircle size={18} color="#981b1b" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ── STEP 1: Shipping & Delivery ── */}
              {step === "Shipping & Delivery" && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-3.5 border-b border-[#f0f0f0]">
                    <div className="flex items-center gap-2.5">
                      <MapPin size={20} color="#f57224" className="shrink-0" />
                      <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                        Delivery Address (Nigeria)
                      </h2>
                    </div>
                    <span className="text-xs font-semibold bg-[#fff8f5] text-[#f57224] px-2.5 py-1 rounded-full border border-[#ffe0d0]">
                      Deliveries Nationwide
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* First Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        value={shipping.firstName}
                        onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={shipping.lastName}
                        onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="john.doe@example.com"
                        value={shipping.email}
                        onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Street Address */}
                    <div className="sm:col-span-2">
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="House / Apartment / Street address"
                        value={shipping.address}
                        onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        City / Town *
                      </label>
                      <input
                        type="text"
                        placeholder="Ikeja / Lekki / Garki"
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    {/* State (Nigerian Dropdown) */}
                    <div style={{ position: "relative" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "6px" }}>
                        State *
                      </label>
                      <button
                        type="button"
                        onClick={() => setStateOpen(!stateOpen)}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          border: "1px solid #ddd",
                          borderRadius: "5px",
                          fontSize: "14px",
                          background: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontFamily: "inherit",
                          color: "#1a1a1a",
                        }}
                      >
                        {shipping.state} State <ChevronDown size={14} color="#888" />
                      </button>
                      {stateOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            zIndex: 50,
                            maxHeight: "220px",
                            overflowY: "auto",
                            marginTop: "4px",
                          }}
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setShipping({ ...shipping, state: st });
                                setStateOpen(false);
                              }}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 14px",
                                background: shipping.state === st ? "#fff8f5" : "#fff",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: "14px",
                                color: shipping.state === st ? "#f57224" : "#1a1a1a",
                                fontWeight: shipping.state === st ? 700 : 400,
                                borderBottom: "1px solid #f5f5f5",
                              }}
                            >
                              {st} State
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Method Selector */}
                  <div className="my-7">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
                      <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] flex items-center gap-2">
                        <Truck size={18} color="#f57224" /> Choose Shipping Option
                      </h3>
                      {shippingQuotes && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #fff8f5, #fff0e8)",
                            color: "#f57224",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            border: "1px solid #ffe0d0",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <MapPin size={11} /> Zone {shippingQuotes.standard.zone} — {shippingQuotes.standard.zoneName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {shippingQuotes && ([
                        {
                          id: "standard" as const,
                          label: "Standard Delivery",
                          quote: shippingQuotes.standard,
                          icon: "📦",
                        },
                        {
                          id: "express" as const,
                          label: "Express Priority Delivery",
                          quote: shippingQuotes.express,
                          icon: "⚡",
                        },
                      ].map(({ id, label, quote, icon }) => (
                        <label
                          key={id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 border-2 rounded-md cursor-pointer transition-all gap-2 sm:gap-4 ${
                            shippingMethod === id ? "border-[#f57224] bg-[#fff8f5]" : "border-[#e8e8e8] bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              value={id}
                              checked={shippingMethod === id}
                              onChange={() => setShippingMethod(id)}
                              className="accent-[#f57224] w-4 h-4 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-sm font-bold text-[#1a1a1a] flex items-center gap-1.5">
                                <span>{icon}</span> {label}
                              </p>
                              <p className="text-xs text-[#777]">
                                Est. {quote.estimatedDays} to {shipping.state} State
                              </p>
                              {quote.isFree && (
                                <p className="text-[11px] text-[#28a745] font-semibold mt-0.5">
                                  ✓ Free shipping on orders over {formatNGN(quote.freeThreshold)}
                                </p>
                              )}
                              {!quote.isFree && id === "standard" && (
                                <p className="text-[11px] text-[#888] mt-0.5">
                                  Free over {formatNGN(quote.freeThreshold)} to {shipping.state}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-extrabold self-end sm:self-center ml-7 sm:ml-0 ${
                            shippingMethod === id ? "text-[#f57224]" : "text-[#1a1a1a]"
                          }`}>
                            {quote.isFree ? (
                              <span className="flex items-center gap-1">
                                <span style={{ textDecoration: "line-through", color: "#bbb", fontWeight: 500, fontSize: "12px" }}>
                                  {formatNGN(getShippingQuotes(shipping.state, 0, totalItemsCount).standard.fee)}
                                </span>
                                <span style={{ color: "#28a745" }}>Free</span>
                              </span>
                            ) : (
                              formatNGN(quote.fee)
                            )}
                          </span>
                        </label>
                      )))}
                    </div>

                    {/* Bulk item note */}
                    {totalItemsCount > 3 && (
                      <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Package size={12} /> Includes ₦{((totalItemsCount - 3) * 200).toLocaleString()} handling fee for {totalItemsCount} items
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("Payment Method")}
                    disabled={!isShippingValid}
                    className={`w-full py-3.5 text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 transition-colors ${
                      isShippingValid ? "bg-[#f57224] cursor-pointer" : "bg-[#e0e0e0] cursor-not-allowed"
                    }`}
                  >
                    Proceed to Payment <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* ── STEP 2: Payment Method ── */}
              {step === "Payment Method" && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-6 pb-3.5 border-b border-[#f0f0f0]">
                    <CreditCard size={20} color="#f57224" className="shrink-0" />
                    <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                      Select Payment Method
                    </h2>
                  </div>

                  {/* Payment selector */}
                  <div className="flex flex-col gap-3 mb-7">
                    {PAYMENT_METHODS.map(({ id, label, sub, badge }) => (
                      <label
                        key={id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 border-2 rounded-md cursor-pointer transition-all gap-2 sm:gap-4 ${
                          payment.method === id ? "border-[#f57224] bg-[#fff8f5]" : "border-[#e8e8e8] bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payment"
                            value={id}
                            checked={payment.method === id}
                            onChange={() => setPayment({ method: id })}
                            className="accent-[#f57224] w-4 h-4 mt-0.5 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#1a1a1a]">
                                {label}
                              </p>
                              <span className="text-[10px] font-bold bg-[#f0f0f0] text-[#555] px-1.5 py-0.5 rounded">
                                {badge}
                              </span>
                            </div>
                            <p className="text-xs text-[#777] mt-0.5">{sub}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Additional payment notes */}
                  {payment.method === "paystack" && (
                    <div className="p-4 bg-[#f8fafc] rounded-md border border-[#e2e8f0] mb-7 flex items-center gap-3">
                      <ShieldCheck size={24} color="#2563eb" className="shrink-0" />
                      <p className="text-xs sm:text-sm color-[#334155] m-0">
                        Protected by <strong>Paystack SSL Encryption</strong>. Supports Visa, Mastercard, Verve, USSD, and Direct Bank Transfer.
                      </p>
                    </div>
                  )}

                  {payment.method === "cod" && (
                    <div className="p-4 bg-[#fff8f0] rounded-md border border-[#ffe0c0] mb-7">
                      <p className="text-xs sm:text-sm text-[#c05a00] font-semibold m-0">
                        Pay with Cash or Card POS upon delivery. Please ensure you provide an active phone number for courier confirmation.
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
                      disabled={isSubmitting}
                      className="flex-1 w-full py-3.5 bg-[#f57224] disabled:bg-[#ffa876] text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <Lock size={16} />{" "}
                      {isSubmitting
                        ? "Processing Order..."
                        : `Place Order — ${formatNGN(total)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Order Confirmation ── */}
              {step === "Order Placed" && placed && orderDetails && (
                <div className="bg-white border border-[#f0f0f0] rounded-lg p-6 sm:p-12 text-center shadow-xs">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#dcf5e7] flex items-center justify-center mx-auto mb-5">
                    <Check size={36} color="#28a745" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] mb-2">
                    Order Confirmed!
                  </h2>
                  <p className="text-sm sm:text-base text-[#666] mb-1">
                    Thank you for your order. We are preparing it for delivery.
                  </p>
                  <p className="text-xs sm:text-sm text-[#888] mb-7">
                    A confirmation email has been sent to{" "}
                    <strong className="text-[#1a1a1a]">{shipping.email}</strong>
                  </p>

                  {/* Summary Card */}
                  <div className="bg-[#f9f9f9] rounded-lg p-4 sm:p-6 mb-8 text-left inline-block w-full max-w-md border border-[#eee]">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "13px", color: "#777" }}>Order Number</span>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#f57224" }}>
                        {orderDetails.orderNumber}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "13px", color: "#777" }}>Delivery Location</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>
                        {shipping.city}, {shipping.state} State
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "13px", color: "#777" }}>Payment Method</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>
                        {payment.method === "paystack" ? "Paystack Card / Transfer" : "Pay on Delivery"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e5e5e5" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>Total Paid / Due</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>
                        {formatNGN(orderDetails.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/orders/tracking?ref=${orderDetails.orderNumber}`}
                      className="px-6 py-3.5 bg-[#1a1a1a] text-white no-underline rounded-md font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Package size={16} /> Track Delivery Status
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

            {/* Right Column — Order Summary Sidebar */}
            <div className="order-1 lg:order-2 bg-white border border-[#f0f0f0] rounded-lg p-4 sm:p-6 lg:sticky lg:top-[90px] shadow-xs h-fit">
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                Order Summary ({totalItemsCount} items)
              </h3>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/placeholder-product.svg"}
                        alt={item.productName || "Product"}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid #f0f0f0",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "#f57224",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>
                        {item.productName}
                      </p>
                      {(item.color || item.size) && (
                        <p style={{ fontSize: "11px", color: "#888", margin: "2px 0 0" }}>
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0 }}>
                      {formatNGN(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Application */}
              <div style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: "8px" }}>
                  <Tag size={12} /> Promo Code
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="e.g. SAVE10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", outline: "none", textTransform: "uppercase" }}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponApplied || !couponCode.trim()}
                    style={{ padding: "8px 14px", background: couponApplied ? "#28a745" : "#1a1a1a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: couponApplied ? "default" : "pointer" }}
                  >
                    {couponApplied ? "Applied" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p style={{ fontSize: "11px", color: "#e53935", marginTop: "4px" }}>{couponError}</p>
                )}
              </div>

              {/* Calculation Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#666" }}>Subtotal</span>
                  <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{formatNGN(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#28a745" }}>Discount</span>
                    <span style={{ fontWeight: 600, color: "#28a745" }}>-{formatNGN(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#666", display: "flex", flexDirection: "column" }}>
                    <span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span>
                    {activeQuote && (
                      <span style={{ fontSize: "10px", color: "#999" }}>
                        Zone {activeQuote.zone} · {activeQuote.estimatedDays}
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: 600, color: shippingCost === 0 ? "#28a745" : "#1a1a1a" }}>
                    {shippingCost === 0 ? "Free" : formatNGN(shippingCost)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#666" }}>VAT (7.5%)</span>
                  <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{formatNGN(vatTax)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderTop: "2px solid #1a1a1a",
                  borderBottom: "2px solid #1a1a1a",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "15px", fontWeight: 700 }}>Grand Total</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#f57224" }}>
                  {formatNGN(total)}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#888" }}>
                <Lock size={12} /> <span>SSL Encrypted &amp; Secure Checkout</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
