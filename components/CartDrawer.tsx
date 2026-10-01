"use client";

import { useRef, useState } from "react";
import { X, ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useCart, type CartResult } from "@/context/CartContext";
import { formatNGN } from "@/lib/utils";
import { MAX_PER_ITEM } from "@/lib/variants";
import ShopImage from "@/components/ShopImage";
import { useDialog } from "@/lib/hooks/use-dialog";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  useDialog(isOpen, onClose, panelRef);

  const run = async (action: Promise<CartResult>) => {
    setError(null);
    const result = await action;
    if (!result.ok) setError(result.error);
  };

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Your bag"
      inert={!isOpen}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "380px",
        maxWidth: "100vw",
        height: "100vh",
        background: "#fff",
        zIndex: 60,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShoppingBag size={20} color="#1a1a1a" />
          <span style={{ fontWeight: 700, fontSize: "16px" }}>
            Your bag ({items.length})
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid #e5e5e5",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
          aria-label="Close bag"
        >
          <X size={16} />
        </button>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {error && (
          <p role="alert" className="mb-2 rounded border border-[#f8b4b4] bg-[#fdf2f2] px-3 py-2 text-xs text-[#981b1b]">
            {error}
          </p>
        )}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b6b6b" }}>
            <ShoppingBag size={40} color="#e0e0e0" style={{ marginBottom: "12px" }} />
            <p style={{ fontSize: "14px" }}>Your bag is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "14px",
                padding: "16px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <ShopImage
                src={item.image || "/placeholder-product.svg"}
                alt={item.productName || "Product"}
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded bg-[#f5f5f5] object-cover"
              />
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "4px",
                    lineHeight: 1.4,
                  }}
                >
                  {item.productName}
                </h4>
                {(item.size || item.color) && (
                  <p style={{ fontSize: "11px", color: "#767676", marginBottom: "4px" }}>
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </p>
                )}
                {item.problem && <p className="mb-1 text-[11px] font-semibold text-[#b42318]">{item.problem}</p>}
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "8px",
                  }}
                >
                  {formatNGN(item.total)}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center overflow-hidden rounded border border-[#e5e5e5]">
                    <button
                      type="button"
                      onClick={() => run(updateQuantity(item.productId, item.variantId, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      aria-label={`One fewer ${item.productName}`}
                      className="flex h-9 w-9 items-center justify-center bg-[#f5f5f5] text-[#444] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center text-sm font-bold" aria-live="polite" aria-label={`Quantity ${item.quantity}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => run(updateQuantity(item.productId, item.variantId, item.quantity + 1))}
                      disabled={
                        item.quantity >= MAX_PER_ITEM || (item.stockAvailable !== null && item.quantity >= item.stockAvailable)
                      }
                      aria-label={`One more ${item.productName}`}
                      className="flex h-9 w-9 items-center justify-center bg-[#f5f5f5] text-[#444] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => run(removeItem(item.productId, item.variantId))}
                    aria-label={`Remove ${item.productName}`}
                    className="flex h-9 items-center gap-1.5 rounded px-2 text-xs font-semibold text-[#767676] transition-colors hover:bg-[#fdf2f2] hover:text-[#b42318]"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#666" }}>Subtotal:</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
              {formatNGN(subtotal)}
            </span>
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            style={{
              display: "block",
              textAlign: "center",
              padding: "13px",
              background: "#f0f0f0",
              color: "#1a1a1a",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "2px",
              marginBottom: "10px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#e5e5e5")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#f0f0f0")
            }
          >
            View Cart
          </Link>
          <Link
            href="/checkout"
            onClick={onClose}
            style={{
              display: "block",
              textAlign: "center",
              padding: "13px",
              background: "#1a1a1a",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "2px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#333")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")
            }
          >
            Checkout Now
          </Link>
        </div>
      )}
    </aside>
  );
}
