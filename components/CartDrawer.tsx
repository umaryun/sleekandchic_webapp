"use client";

import { X, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const sampleCartItems = [
  {
    id: 1,
    name: "Elegant Wooden Wall Clock",
    price: 49.99,
    quantity: 1,
    image: "https://placehold.co/80x80/f0ece4/999?text=P1",
  },
  {
    id: 2,
    name: "Modern Sunglasses Pro",
    price: 89.99,
    quantity: 2,
    image: "https://placehold.co/80x80/ece4f0/999?text=P2",
  },
];

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const total = sampleCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "380px",
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
            My Cart ({sampleCartItems.length})
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
          aria-label="Close cart"
        >
          <X size={16} />
        </button>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {sampleCartItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              gap: "14px",
              padding: "16px 0",
              borderBottom: "1px solid #f5f5f5",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: "72px",
                height: "72px",
                objectFit: "cover",
                borderRadius: "4px",
                background: "#f5f5f5",
                flexShrink: 0,
              }}
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
                {item.name}
              </h4>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                Qty: {item.quantity}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                }}
              >
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ccc",
                alignSelf: "flex-start",
                padding: "4px",
              }}
              aria-label="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
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
            ${total.toFixed(2)}
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
    </aside>
  );
}
