"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Truck, MapPin, CheckCircle, Clock, Search } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatNGN } from "@/lib/utils";

type TrackStatus = "processing" | "shipped" | "out_for_delivery" | "delivered";

const MOCK_ORDER = {
  number: "NC-48291",
  date: "Jun 15, 2025",
  email: "customer@example.com",
  status: "shipped" as TrackStatus,
  estimatedDelivery: "Jun 21, 2025",
  carrier: "FedEx",
  trackingNumber: "FX-298371928310",
  items: [
    { name: "Elegant Wooden Wall Clock", qty: 1, price: 49.99, image: "https://placehold.co/56x56/f0ece4/999?text=P1" },
    { name: "Modern Sunglasses Pro", qty: 2, price: 89.99, image: "https://placehold.co/56x56/ece4f0/999?text=P2" },
  ],
  events: [
    { date: "Jun 18, 2025", time: "14:32", label: "Out for Delivery", location: "Lagos Distribution Center", done: true },
    { date: "Jun 17, 2025", time: "09:15", label: "Arrived at Local Facility", location: "Lagos, NG", done: true },
    { date: "Jun 16, 2025", time: "22:04", label: "In Transit", location: "Amsterdam Hub", done: true },
    { date: "Jun 15, 2025", time: "17:50", label: "Shipped", location: "New York Warehouse", done: true },
    { date: "Jun 15, 2025", time: "11:00", label: "Order Confirmed & Processing", location: "Sleekandchic Fulfillment Center", done: true },
  ],
  address: "24 Victoria Island, Lagos, Nigeria",
  subtotal: 229.97,
  shipping: 14.99,
  total: 244.96,
};

const STEPS: { key: TrackStatus; label: string; Icon: React.ComponentType<{ size: number; color?: string }> }[] = [
  { key: "processing", label: "Order Placed", Icon: Package },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", Icon: MapPin },
  { key: "delivered", label: "Delivered", Icon: CheckCircle },
];
const STATUS_ORDER: TrackStatus[] = ["processing", "shipped", "out_for_delivery", "delivered"];

export default function OrderTrackingPage() {
  const [orderNum, setOrderNum] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<typeof MOCK_ORDER | null>(null);
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNum.trim() === "NC-48291" || orderNum.trim() === "") {
      setOrder(MOCK_ORDER);
      setError("");
    } else {
      setError("Order not found. Try order number NC-48291 as a demo.");
      setOrder(null);
    }
  };

  const activeIdx = STATUS_ORDER.indexOf(MOCK_ORDER.status);

  return (
    <ShopLayout>
      <PageBreadcrumb title="Order Tracking" crumbs={[{ label: "My Account", href: "/login" }]} />

      <div style={{ maxWidth: "960px", margin: "48px auto", padding: "0 16px" }}>
        {/* Search Form */}
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "36px 40px", marginBottom: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fff3ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Package size={28} color="#f57224" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a1a1a", marginBottom: "8px" }}>Track Your Order</h2>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.7 }}>
              Enter your order number and email address to get real-time updates on your shipment.
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Order Number *</label>
              <input type="text" placeholder="e.g. NC-48291" value={orderNum} onChange={(e) => setOrderNum(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Email Address</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>
            <button type="submit" style={{ padding: "11px 24px", background: "#f57224", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", transition: "background 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e06010")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
            >
              <Search size={15} /> Track Order
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "14px", padding: "12px 16px", background: "#fff5f5", border: "1px solid #ffc0c0", borderRadius: "4px", fontSize: "13px", color: "#c0392b", fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "16px" }}>
            💡 Demo: Leave the order field blank or type <code style={{ background: "#f5f5f5", padding: "1px 6px", borderRadius: "3px" }}>NC-48291</code> to see a sample tracking result.
          </p>
        </div>

        {/* Tracking Result */}
        {order && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Order Number</p>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>{order.number}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Order Date</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{order.date}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Carrier</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{order.carrier}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Est. Delivery</p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#28a745" }}>{order.estimatedDelivery}</p>
              </div>
              <div style={{ padding: "8px 18px", background: "#fff3ec", border: "1px solid #ffe0c0", borderRadius: "20px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f57224" }}>
                  🚚 {order.status === "shipped" ? "In Transit" : order.status === "out_for_delivery" ? "Out for Delivery" : order.status === "delivered" ? "Delivered" : "Processing"}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "32px 28px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
                {/* Connector line */}
                <div style={{ position: "absolute", top: "20px", left: "10%", right: "10%", height: "3px", background: "#f0f0f0", zIndex: 0 }}>
                  <div style={{ height: "100%", background: "#f57224", width: `${(activeIdx / (STEPS.length - 1)) * 100}%`, transition: "width 0.5s ease" }} />
                </div>
                {STEPS.map(({ key, label, Icon }, i) => {
                  const done = STATUS_ORDER.indexOf(key) <= activeIdx;
                  const active = key === MOCK_ORDER.status;
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative", zIndex: 1, flex: 1 }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#f57224" : "#f0f0f0", border: active ? "3px solid #f57224" : done ? "none" : "2px solid #ddd", boxShadow: active ? "0 0 0 4px rgba(245,114,36,0.15)" : "none", transition: "all 0.3s" }}>
                        <Icon size={18} color={done ? "#fff" : "#aaa"} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "12px", fontWeight: done ? 700 : 500, color: done ? "#1a1a1a" : "#aaa" }}>{label}</p>
                        {active && <p style={{ fontSize: "11px", color: "#f57224", fontWeight: 600 }}>Current</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline + Order Items */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Event Timeline */}
              <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "24px 28px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#f57224" /> Tracking History
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {order.events.map((event, i) => (
                    <div key={i} style={{ display: "flex", gap: "16px", position: "relative" }}>
                      {/* Dot + line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: i === 0 ? "#f57224" : "#e0e0e0", border: `2px solid ${i === 0 ? "#f57224" : "#ccc"}`, marginTop: "3px" }} />
                        {i < order.events.length - 1 && <div style={{ width: "2px", flex: 1, background: "#f0f0f0", minHeight: "28px", margin: "4px 0" }} />}
                      </div>
                      <div style={{ paddingBottom: i < order.events.length - 1 ? "18px" : "0" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: i === 0 ? "#1a1a1a" : "#555" }}>{event.label}</p>
                        <p style={{ fontSize: "12px", color: "#888" }}>{event.location}</p>
                        <p style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{event.date} at {event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items + Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "24px 28px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "16px" }}>Order Items</h3>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: i < order.items.length - 1 ? "1px solid #f5f5f5" : "none", marginBottom: i < order.items.length - 1 ? "12px" : "0" }}>
                      <img src={item.image} alt={item.name} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "4px", border: "1px solid #f0f0f0" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>{item.name}</p>
                        <p style={{ fontSize: "12px", color: "#888" }}>Qty: {item.qty}</p>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{formatNGN(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "2px solid #f0f0f0", paddingTop: "12px", marginTop: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#f57224" }}>{formatNGN(order.total)}</span>
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "20px 24px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={15} color="#f57224" /> Delivery Address
                  </h3>
                  <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7 }}>{order.address}</p>
                </div>

                <Link href="/products" style={{ padding: "13px", background: "#1a1a1a", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", textAlign: "center", display: "block", transition: "background 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f57224")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
