"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/types";

const tabs = [
  { id: "all", label: "All", badge: undefined as "sale" | "new" | "hot" | undefined },
  { id: "sale", label: "On Sale", badge: "sale" as const },
  { id: "new", label: "New Arrivals", badge: "new" as const },
  { id: "hot", label: "Best Sellers", badge: "hot" as const },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tab = tabs.find((t) => t.id === activeTab);
    fetchProducts({
      limit: 8,
      badge: tab?.badge,
      sort: "newest",
    })
      .then((data) => setProducts(data.products))
      .catch((err) => console.error("FeaturedProducts fetch error:", err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "0 auto 56px",
        padding: "0 16px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "#b88d7a",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            This Week
          </p>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            Featured Products
          </h2>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#f5f5f5",
            borderRadius: "4px",
            padding: "4px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "3px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: activeTab === tab.id ? "#1a1a1a" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#666",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ paddingTop: "100%", background: "#f5f5f5" }} className="animate-pulse" />
              <div style={{ padding: "14px 16px" }}>
                <div style={{ height: "16px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "10px", width: "80%" }} className="animate-pulse" />
                <div style={{ height: "14px", background: "#f0f0f0", borderRadius: "4px", width: "50%" }} className="animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
          <p style={{ fontSize: "16px" }}>No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}

      {/* View All */}
      <div style={{ textAlign: "center", marginTop: "36px" }}>
        <Link
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 36px",
            border: "2px solid #1a1a1a",
            color: "#1a1a1a",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "2px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "#1a1a1a";
            el.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "transparent";
            el.style.color = "#1a1a1a";
          }}
        >
          View All Products
        </Link>
      </div>

    </section>
  );
}
