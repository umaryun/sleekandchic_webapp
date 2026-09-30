"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";
import { useCart, type CartResult } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, loading, updateQuantity, removeItem } = useCart();
  const [error, setError] = useState<string | null>(null);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const hasProblems = items.some((i) => i.problem);

  const run = async (action: Promise<CartResult>) => {
    setError(null);
    const result = await action;
    if (!result.ok) setError(result.error);
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Shopping Cart" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {loading ? (
          <div className="flex justify-center py-20 text-[#888]">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <ShoppingCart size={64} color="#e0e0e0" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>Your cart is empty</h2>
            <p style={{ color: "#888", marginBottom: "28px" }}>Looks like you haven&apos;t added anything to your cart yet.</p>
            <Link
              href="/products"
              style={{ padding: "12px 32px", background: "#1a1a1a", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700, fontSize: "14px" }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
            <div>
              {error && (
                <div role="alert" className="mb-4 flex items-center gap-2.5 rounded-md border border-[#f8b4b4] bg-[#fdf2f2] px-4 py-3 text-sm text-[#981b1b]">
                  <AlertCircle size={18} className="shrink-0" /> {error}
                </div>
              )}
              <div className="bg-white border border-[#f0f0f0] rounded overflow-hidden">
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3 px-5 py-3.5 bg-[#f8f8f8] border-b border-[#f0f0f0] text-xs font-bold text-[#888] tracking-wider uppercase">
                  <span>Product</span>
                  <span className="text-center">Price</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-center">Total</span>
                  <span />
                </div>
                {items.map((item) => {
                  const atStockLimit = item.stockAvailable !== null && item.quantity >= item.stockAvailable;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 p-5 items-start md:items-center border-b border-[#f5f5f5] last:border-b-0 relative w-full"
                    >
                      <div className="flex items-center gap-3.5 w-full pr-8 md:pr-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || "/placeholder-product.svg"}
                          alt={item.productName || "Product"}
                          className="w-16 h-16 object-cover rounded border border-[#f0f0f0] shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productSlug || item.productId}`}
                            className="text-sm font-semibold text-[#1a1a1a] no-underline hover:text-[#8a6452] transition-colors"
                          >
                            {item.productName}
                          </Link>
                          {(item.color || item.size) && (
                            <p className="text-xs text-[#777] mt-1">
                              {[item.color && `Colour: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {item.problem && <p className="text-xs font-semibold text-[#b42318] mt-1">{item.problem}</p>}
                          <p className="text-xs text-[#555] font-semibold mt-1 md:hidden">Price: {formatNGN(item.unitPrice)}</p>
                        </div>
                      </div>
                      <span className="hidden md:block text-center text-sm font-semibold text-[#555] w-full">{formatNGN(item.unitPrice)}</span>
                      <div className="flex items-center md:justify-center w-full md:w-auto">
                        <span className="text-xs font-semibold text-[#888] mr-3 md:hidden">Qty:</span>
                        <div className="flex border border-[#e5e5e5] rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => run(updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1)))}
                            disabled={item.quantity <= 1}
                            className="w-8 h-9 bg-[#f5f5f5] border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center"
                            aria-label={`Decrease quantity of ${item.productName}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-10 flex items-center justify-center text-sm font-bold" aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => run(updateQuantity(item.productId, item.variantId, item.quantity + 1))}
                            disabled={atStockLimit}
                            className="w-8 h-9 bg-[#f5f5f5] border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center"
                            aria-label={`Increase quantity of ${item.productName}`}
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
                        type="button"
                        onClick={() => run(removeItem(item.productId, item.variantId))}
                        className="absolute top-5 right-5 md:static bg-transparent border-none cursor-pointer text-[#999] hover:text-red-600 transition-colors flex items-center justify-center"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-[#1a1a1a] text-[#1a1a1a] no-underline rounded-[3px] text-[13px] font-semibold hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-[#f0f0f0] rounded p-6 lg:sticky lg:top-[90px]">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-5 pb-4 border-b border-[#f0f0f0]">Order Summary</h3>
              <div className="flex justify-between text-[13px] mb-3">
                <span className="text-[#666]">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                <span className="font-semibold text-[#1a1a1a]">{formatNGN(subtotal)}</span>
              </div>
              <p className="text-xs text-[#777] mb-5 pb-5 border-b border-[#f0f0f0]">
                Delivery is calculated at checkout from your state. You can add a promo code there too.
              </p>

              {hasProblems ? (
                <p className="rounded bg-[#fffaeb] border border-[#f3d38b] px-3 py-2.5 text-xs text-[#7a5200] mb-3">
                  Update the items marked above before checking out.
                </p>
              ) : null}
              <Link
                href="/checkout"
                aria-disabled={hasProblems}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-[3px] font-bold text-[15px] no-underline transition-colors ${
                  hasProblems ? "bg-[#d0d0d0] text-white pointer-events-none" : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                }`}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-[#888] text-center mt-3">Pay by card, bank transfer or USSD with Paystack, or pay on delivery.</p>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
