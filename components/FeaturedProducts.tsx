"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { products } from "@/data";
import type { Product } from "@/types";

const tabs = [
  { id: "all", label: "All" },
  { id: "sale", label: "On Sale" },
  { id: "new", label: "New Arrivals" },
  { id: "hot", label: "Best Sellers" },
];

interface FeaturedProductsProps {
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export default function FeaturedProducts({ onAddToCart, onAddToWishlist }: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? products
      : products.filter((p) => p.badge === activeTab);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filtered.slice(0, 8).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>

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
