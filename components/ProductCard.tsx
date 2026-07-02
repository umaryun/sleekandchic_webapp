"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye, GitCompare } from "lucide-react";
import StarRating from "./StarRating";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  const [isWished, setIsWished] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    onAddToCart?.(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlist = () => {
    setIsWished(!isWished);
    onAddToWishlist?.(product);
  };

  const badgeColors: Record<string, { bg: string; color: string }> = {
    sale: { bg: "#b88d7a", color: "#fff" },
    new: { bg: "#5a8a6a", color: "#fff" },
    hot: { bg: "#c45b5b", color: "#fff" },
  };

  return (
    <div
      className="product-card"
      style={{
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Badge */}
      {product.badge && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 2,
            background: badgeColors[product.badge].bg,
            color: badgeColors[product.badge].color,
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "2px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {product.badge === "sale" && product.discount
            ? `-${product.discount}%`
            : product.badge}
        </div>
      )}

      {/* Wishlist button (always visible) */}
      <button
        onClick={handleWishlist}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 2,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#fff",
          border: "1px solid #e5e5e5",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          transition: "all 0.2s",
          color: isWished ? "#b88d7a" : "#666",
        }}
        aria-label="Add to wishlist"
      >
        <Heart size={14} fill={isWished ? "#b88d7a" : "none"} />
      </button>

      {/* Product image */}
      <Link href={`/products/${product.id}`}>
        <div
          style={{
            position: "relative",
            paddingTop: "100%",
            overflow: "hidden",
            background: "#fafafa",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
            }}
          />
        </div>
      </Link>

      {/* Hover Actions */}
      <div
        className="product-actions"
        style={{
          position: "absolute",
          bottom: "140px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          padding: "0 12px",
          opacity: 0,
          transform: "translateY(10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          zIndex: 2,
        }}
      >
        <button
          onClick={handleAddToCart}
          style={{
            flex: 1,
            padding: "8px 0",
            background: addedToCart ? "#28a745" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background 0.2s",
          }}
        >
          <ShoppingCart size={13} />
          {addedToCart ? "Added!" : "Add to Cart"}
        </button>
        <Link
          href={`/products/${product.id}`}
          style={{
            width: "36px",
            height: "36px",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1a1a1a",
            flexShrink: 0,
          }}
          title="Quick view"
        >
          <Eye size={14} />
        </Link>
        <button
          style={{
            width: "36px",
            height: "36px",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1a1a1a",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="Compare"
        >
          <GitCompare size={14} />
        </button>
      </div>

      {/* Product Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Category */}
        <p
          style={{
            fontSize: "11px",
            color: "#b88d7a",
            fontWeight: 500,
            marginBottom: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {product.category}
        </p>

        {/* Name */}
        <Link
          href={`/products/${product.id}`}
          style={{ textDecoration: "none" }}
        >
          <h3
            className="line-clamp-2"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1a1a1a",
              marginBottom: "8px",
              lineHeight: 1.4,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#b88d7a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#1a1a1a";
            }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <div style={{ marginBottom: "10px" }}>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span
              style={{
                fontSize: "13px",
                color: "#aaa",
                textDecoration: "line-through",
              }}
            >
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Hover style override */}
      <style>{`
        .product-card:hover .product-actions {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .product-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}
