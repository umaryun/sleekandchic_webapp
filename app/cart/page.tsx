"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const initialCart = [
  { id: 1, name: "Elegant Wooden Wall Clock", price: 49.99, quantity: 1, size: "M", color: "Brown", image: "https://placehold.co/80x80/f0ece4/999?text=P1" },
  { id: 2, name: "Modern Sunglasses Pro", price: 89.99, quantity: 2, size: "One Size", color: "Black", image: "https://placehold.co/80x80/ece4f0/999?text=P2" },
  { id: 3, name: "Silk Scarf Accessories", price: 29.99, quantity: 1, size: "L", color: "Red", image: "https://placehold.co/80x80/e4ecf0/999?text=P3" },
];

export default function CartPage() {
  const [cart, setCart] = useState(initialCart);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const updateQty = (id: number, delta: number) =>
    setCart(c => c.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const remove = (id: number) => setCart(c => c.filter(i => i.id !== id));
  const applyCoupon = () => {
    if (coupon.toUpperCase() === "SAVE10") { setDiscount(10); }
    else { alert("Invalid coupon code"); }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal - discount + shipping;

  return (
    <ShopLayout>
      <PageBreadcrumb title="Shopping Cart" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <ShoppingBag size={64} color="#e0e0e0" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>Your cart is empty</h2>
            <p style={{ color: "#888", marginBottom: "28px" }}>Looks like you haven&apos;t added anything to your cart yet.</p>
            <Link href="/products" style={{ padding: "12px 32px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700, fontSize: "14px" }}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "flex-start" }}>
            {/* Cart Table */}
            <div>
              <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px", gap: "12px", padding: "14px 20px", background: "#f8f8f8", borderBottom: "1px solid #f0f0f0", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  <span>Product</span><span style={{ textAlign: "center" }}>Price</span><span style={{ textAlign: "center" }}>Quantity</span><span style={{ textAlign: "center" }}>Total</span><span />
                </div>
                {cart.map((item, idx) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px", gap: "12px", padding: "20px", alignItems: "center", borderBottom: idx < cart.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img src={item.image} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "4px", border: "1px solid #f0f0f0" }} />
                      <div>
                        <Link href={`/products/${item.id}`} style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", textDecoration: "none" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a")}
                        >{item.name}</Link>
                        <p style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>Color: {item.color} · Size: {item.size}</p>
                      </div>
                    </div>
                    <span style={{ textAlign: "center", fontSize: "14px", fontWeight: 600, color: "#555" }}>${item.price.toFixed(2)}</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ display: "flex", border: "1px solid #e5e5e5", borderRadius: "3px", overflow: "hidden" }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: "32px", height: "36px", background: "#f5f5f5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: "32px", height: "36px", background: "#f5f5f5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <span style={{ textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f44336")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ccc")}
                    ><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
                <Link href="/products" style={{ padding: "10px 20px", border: "1px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", borderRadius: "3px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a"; }}
                >← Continue Shopping</Link>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "24px", position: "sticky", top: "90px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>Order Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
                  { label: "Shipping", value: shipping === 0 ? "Free" : `$${shipping.toFixed(2)}` },
                  ...(discount ? [{ label: "Coupon Discount", value: `-$${discount.toFixed(2)}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#666" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === "Coupon Discount" ? "#28a745" : "#1a1a1a" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>
                  <Tag size={12} /> Coupon Code
                </label>
                <div style={{ display: "flex", gap: "0" }}>
                  <input type="text" placeholder="Enter code (SAVE10)" value={coupon} onChange={(e) => setCoupon(e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #ddd", borderRight: "none", borderRadius: "3px 0 0 3px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                  />
                  <button onClick={applyCoupon} style={{ padding: "9px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "0 3px 3px 0", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                  >Apply</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>${total.toFixed(2)}</span>
              </div>

              <Link href="/checkout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700, fontSize: "15px", transition: "background 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#e06010")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f57224")}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "12px" }}>
                🔒 Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
