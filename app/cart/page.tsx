"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "SAVE10") {
      setDiscount(10);
    } else {
      alert("Invalid coupon code");
    }
  };

  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = Math.max(0, subtotal - discount + (items.length > 0 ? shipping : 0));

  return (
    <ShopLayout>
      <PageBreadcrumb title="Shopping Cart" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <ShoppingCart size={64} color="#e0e0e0" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>
              Your cart is empty
            </h2>
            <p style={{ color: "#888", marginBottom: "28px" }}>
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/products"
              style={{
                padding: "12px 32px",
                background: "#f57224",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "3px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
            {/* Cart Table */}
            <div>
              <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                {/* Header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3 px-5 py-3.5 bg-[#f8f8f8] border-b border-[#f0f0f0] text-xs font-bold text-[#888] tracking-wider uppercase">
                  <span>Product</span>
                  <span className="text-center">Price</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-center">Total</span>
                  <span />
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 p-5 items-start md:items-center border-b border-[#f5f5f5] last:border-b-0 relative w-full"
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/placeholder-product.svg"}
                        alt={item.productName || "Product"}
                        className="w-16 h-16 object-cover rounded border border-[#f0f0f0] shrink-0"
                      />
                      <div>
                        <Link
                          href={`/products/${item.productSlug || item.productId}`}
                          className="text-sm font-semibold text-[#1a1a1a] no-underline hover:text-[#b88d7a] transition-colors"
                        >
                          {item.productName}
                        </Link>
                        {(item.color || item.size) && (
                          <p className="text-xs text-[#888] mt-1">
                            {[item.color && `Color: ${item.color}`, item.size && `Size: ${item.size}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {/* Mobile price indicator */}
                        <p className="text-xs text-[#555] font-semibold mt-1 md:hidden">
                          Price: {formatNGN(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="hidden md:block text-center text-sm font-semibold text-[#555] w-full">
                      {formatNGN(item.unitPrice)}
                    </span>
                    <div className="flex items-center md:justify-center w-full md:w-auto">
                      <span className="text-xs font-semibold text-[#888] mr-3 md:hidden">Qty:</span>
                      <div className="flex border border-[#e5e5e5] rounded overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                          className="w-8 h-9 bg-[#f5f5f5] border-none cursor-pointer flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 flex items-center justify-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-8 h-9 bg-[#f5f5f5] border-none cursor-pointer flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex md:justify-center items-center w-full border-t border-[#f5f5f5] pt-3 md:pt-0 md:border-t-0 md:w-auto">
                      <span className="text-xs font-bold text-[#888] mr-3 md:hidden">Subtotal:</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">{formatNGN(item.total)}</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="absolute top-5 right-5 md:static bg-none border-none cursor-pointer text-[#ccc] hover:text-red-500 transition-colors flex items-center justify-center"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
                <Link
                  href="/products"
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #1a1a1a",
                    color: "#1a1a1a",
                    textDecoration: "none",
                    borderRadius: "3px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a";
                  }}
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "24px", position: "sticky", top: "90px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
                Order Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Subtotal", value: formatNGN(subtotal) },
                  { label: "Shipping", value: shipping === 0 ? "Free" : formatNGN(shipping) },
                  ...(discount ? [{ label: "Coupon Discount", value: `-${formatNGN(discount)}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#666" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === "Coupon Discount" ? "#28a745" : "#1a1a1a" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>
                  <Tag size={12} /> Coupon Code
                </label>
                <div style={{ display: "flex", gap: "0" }}>
                  <input
                    type="text"
                    placeholder="Enter code (SAVE10)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #ddd", borderRight: "none", borderRadius: "3px 0 0 3px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                  />
                  <button
                    onClick={applyCoupon}
                    style={{ padding: "9px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "0 3px 3px 0", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>
                  {formatNGN(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700, fontSize: "15px", transition: "background 0.2s" }}
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
