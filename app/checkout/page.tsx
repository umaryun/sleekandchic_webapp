"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, CreditCard, Truck, Package, MapPin, Lock, ChevronDown } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const STEPS = ["Shipping", "Payment", "Confirmation"] as const;
type Step = (typeof STEPS)[number];

const CART_ITEMS = [
  { id: 1, name: "Elegant Wooden Wall Clock", price: 49.99, quantity: 1, image: "https://placehold.co/64x64/f0ece4/999?text=P1" },
  { id: 2, name: "Modern Sunglasses Pro", price: 89.99, quantity: 2, image: "https://placehold.co/64x64/ece4f0/999?text=P2" },
];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Nigeria", "South Africa"];
const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "apple", label: "Apple Pay", icon: "" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("Shipping");
  const [countryOpen, setCountryOpen] = useState(false);
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", city: "",
    state: "", zip: "", country: "United States", sameAsBilling: true,
  });
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState({ method: "card", cardNumber: "", expiry: "", cvv: "", name: "" });
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const subtotal = CART_ITEMS.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = shippingMethod === "express" ? 14.99 : subtotal >= 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const stepIndex = STEPS.indexOf(step);

  const inp = (
    placeholder: string,
    key: keyof typeof shipping,
    type = "text",
    half = false
  ) => (
    <div style={{ gridColumn: half ? "span 1" : "span 2" }}>
      <input
        type={type}
        placeholder={placeholder}
        value={shipping[key] as string}
        onChange={(e) => setShipping({ ...shipping, [key]: e.target.value })}
        style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
      />
    </div>
  );

  return (
    <ShopLayout>
      <PageBreadcrumb title="Checkout" crumbs={[{ label: "Cart", href: "/cart" }]} />

      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "flex-start" }}>
        {/* Left column */}
        <div>
          {/* Step progress */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <button
                  onClick={() => i < stepIndex && setStep(s)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: i < stepIndex ? "pointer" : "default", padding: 0 }}
                >
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: 700,
                    background: i < stepIndex ? "#28a745" : i === stepIndex ? "#f57224" : "#e5e5e5",
                    color: i <= stepIndex ? "#fff" : "#aaa",
                    transition: "all 0.3s",
                  }}>
                    {i < stepIndex ? <Check size={15} /> : i + 1}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: i === stepIndex ? 700 : 500, color: i === stepIndex ? "#1a1a1a" : i < stepIndex ? "#28a745" : "#aaa" }}>{s}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < stepIndex ? "#28a745" : "#e5e5e5", margin: "0 12px", transition: "background 0.3s" }} />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Shipping ── */}
          {step === "Shipping" && (
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <MapPin size={20} color="#f57224" />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>Shipping Address</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
                {inp("First Name *", "firstName", "text", true)}
                {inp("Last Name *", "lastName", "text", true)}
                {inp("Email Address *", "email", "email")}
                {inp("Phone Number", "phone", "tel")}
                {inp("Street Address *", "address")}
                {inp("City *", "city", "text", true)}
                {inp("State / Province", "state", "text", true)}
                {inp("ZIP / Postal Code", "zip", "text", true)}

                {/* Country dropdown */}
                <div style={{ gridColumn: "span 1", position: "relative" }}>
                  <button
                    onClick={() => setCountryOpen(!countryOpen)}
                    style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", color: "#1a1a1a" }}
                  >
                    {shipping.country} <ChevronDown size={14} color="#aaa" />
                  </button>
                  {countryOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ddd", borderRadius: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: "200px", overflowY: "auto", marginTop: "2px" }}>
                      {COUNTRIES.map(c => (
                        <button key={c} onClick={() => { setShipping({ ...shipping, country: c }); setCountryOpen(false); }}
                          style={{ display: "block", width: "100%", padding: "9px 14px", background: shipping.country === c ? "#fff8f5" : "#fff", border: "none", cursor: "pointer", textAlign: "left", fontSize: "14px", color: shipping.country === c ? "#f57224" : "#1a1a1a", fontWeight: shipping.country === c ? 600 : 400, borderBottom: "1px solid #f5f5f5" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping method */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={18} color="#f57224" /> Shipping Method
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {([
                    { id: "standard", label: "Standard Shipping", sub: "5–8 business days", price: subtotal >= 100 ? "Free" : "$9.99" },
                    { id: "express", label: "Express Shipping", sub: "1–3 business days", price: "$14.99" },
                  ] as const).map(({ id, label, sub, price }) => (
                    <label key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: `2px solid ${shippingMethod === id ? "#f57224" : "#e5e5e5"}`, borderRadius: "6px", cursor: "pointer", background: shippingMethod === id ? "#fff8f5" : "#fff", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input type="radio" name="shipping" value={id} checked={shippingMethod === id} onChange={() => setShippingMethod(id)}
                          style={{ accentColor: "#f57224", width: "16px", height: "16px" }} />
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{label}</p>
                          <p style={{ fontSize: "12px", color: "#888" }}>{sub}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: shippingMethod === id ? "#f57224" : "#1a1a1a" }}>{price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#555", cursor: "pointer", marginBottom: "28px" }}>
                <input type="checkbox" checked={shipping.sameAsBilling} onChange={(e) => setShipping({ ...shipping, sameAsBilling: e.target.checked })}
                  style={{ accentColor: "#f57224", width: "15px", height: "15px" }} />
                Billing address is the same as shipping address
              </label>

              <button
                onClick={() => setStep("Payment")}
                disabled={!shipping.firstName || !shipping.lastName || !shipping.email || !shipping.address || !shipping.city || !shipping.zip}
                style={{ padding: "13px 32px", background: "#f57224", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s", opacity: (!shipping.firstName || !shipping.email || !shipping.address) ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (!(!shipping.firstName || !shipping.email || !shipping.address)) (e.currentTarget as HTMLButtonElement).style.background = "#e06010"; }}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
              >
                Continue to Payment <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === "Payment" && (
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <CreditCard size={20} color="#f57224" />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>Payment Method</h2>
              </div>

              {/* Payment method selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                {PAYMENT_METHODS.map(({ id, label, icon }) => (
                  <label key={id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", border: `2px solid ${payment.method === id ? "#f57224" : "#e5e5e5"}`, borderRadius: "6px", cursor: "pointer", background: payment.method === id ? "#fff8f5" : "#fff", transition: "all 0.2s" }}>
                    <input type="radio" name="payment" value={id} checked={payment.method === id} onChange={() => setPayment({ ...payment, method: id })}
                      style={{ accentColor: "#f57224", width: "15px", height: "15px" }} />
                    <span style={{ fontSize: "18px" }}>{icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Card fields */}
              {payment.method === "card" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px", background: "#fafafa", borderRadius: "6px", border: "1px solid #f0f0f0", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Lock size={14} color="#888" />
                    <span style={{ fontSize: "12px", color: "#888" }}>Your card details are encrypted and secure</span>
                  </div>
                  {[
                    { ph: "Cardholder Name", key: "name", type: "text" },
                    { ph: "Card Number (1234 5678 9012 3456)", key: "cardNumber", type: "text" },
                  ].map(({ ph, key, type }) => (
                    <input key={key} type={type} placeholder={ph} value={payment[key as keyof typeof payment]}
                      onChange={(e) => setPayment({ ...payment, [key]: e.target.value })}
                      style={{ padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                    />
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {[{ ph: "MM / YY", key: "expiry" }, { ph: "CVV", key: "cvv" }].map(({ ph, key }) => (
                      <input key={key} type="text" placeholder={ph} value={payment[key as keyof typeof payment]}
                        onChange={(e) => setPayment({ ...payment, [key]: e.target.value })}
                        style={{ padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(payment.method === "paypal" || payment.method === "apple") && (
                <div style={{ padding: "28px", background: "#fafafa", borderRadius: "6px", border: "1px solid #f0f0f0", textAlign: "center", marginBottom: "24px" }}>
                  <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
                    You will be redirected to {payment.method === "paypal" ? "PayPal" : "Apple Pay"} to complete your payment securely.
                  </p>
                  <div style={{ fontSize: "40px" }}>{payment.method === "paypal" ? "🅿️" : ""}</div>
                </div>
              )}

              {payment.method === "cod" && (
                <div style={{ padding: "20px", background: "#fff8f0", borderRadius: "6px", border: "1px solid #ffe0c0", marginBottom: "24px" }}>
                  <p style={{ fontSize: "14px", color: "#c05a00", fontWeight: 500 }}>
                    💵 You will pay in cash when your order is delivered. Please have the exact amount ready.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep("Shipping")}
                  style={{ padding: "13px 20px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "background 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e5e5e5")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f5f5f5")}
                >
                  ← Back
                </button>
                <button onClick={() => {
                  setStep("Confirmation");
                  setPlaced(true);
                  setOrderNumber(`#NC-${Math.floor(Math.random() * 90000) + 10000}`);
                }}
                  style={{ flex: 1, padding: "13px", background: "#f57224", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e06010")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                >
                  <Lock size={15} /> Place Order — ${total.toFixed(2)}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirmation ── */}
          {step === "Confirmation" && placed && (
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "48px 32px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#dcf5e7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Check size={36} color="#28a745" />
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#1a1a1a", marginBottom: "10px" }}>Order Placed Successfully!</h2>
              <p style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>
                Thank you for your purchase. Your order is being processed.
              </p>
              <p style={{ fontSize: "14px", color: "#888", marginBottom: "32px" }}>
                Order confirmation has been sent to <strong style={{ color: "#1a1a1a" }}>{shipping.email || "your email"}</strong>
              </p>

              {/* Order summary */}
              <div style={{ background: "#f8f8f8", borderRadius: "6px", padding: "20px 24px", marginBottom: "32px", textAlign: "left", display: "inline-block", minWidth: "360px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#888" }}>Order Number</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#f57224" }}>{orderNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#888" }}>Date</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#888" }}>Payment</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}>{payment.method === "card" ? "Credit Card" : payment.method === "cod" ? "Cash on Delivery" : payment.method}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e5e5e5" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                <Link href="/orders/tracking" style={{ padding: "12px 28px", background: "#1a1a1a", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#333")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")}
                >
                  <Package size={15} /> Track Order
                </Link>
                <Link href="/products" style={{ padding: "12px 28px", border: "2px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a"; }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "24px", position: "sticky", top: "90px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #f0f0f0" }}>
            Order Summary ({CART_ITEMS.reduce((s, i) => s + i.quantity, 0)} items)
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
            {CART_ITEMS.map(item => (
              <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={item.image} alt={item.name} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "4px", border: "1px solid #f0f0f0" }} />
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#f57224", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.quantity}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.4 }}>{item.name}</p>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0 }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginBottom: "16px" }}>
            {[
              { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
              { label: `Shipping (${shippingMethod === "express" ? "Express" : "Standard"})`, value: shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}` },
              { label: "Tax (8%)", value: `$${tax.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#666" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "2px solid #1a1a1a", borderBottom: "2px solid #1a1a1a", marginBottom: "16px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#f57224" }}>${total.toFixed(2)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#888" }}>
            <Lock size={12} /> <span>SSL encrypted &amp; secure checkout</span>
          </div>

          {/* Accepted cards */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
            {["Visa", "MC", "AmEx", "PayPal"].map(card => (
              <div key={card} style={{ padding: "4px 8px", background: "#f5f5f5", borderRadius: "3px", fontSize: "10px", color: "#888", fontWeight: 700 }}>{card}</div>
            ))}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
