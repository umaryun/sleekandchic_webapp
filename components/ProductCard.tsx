"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [viewBtnHovered, setViewBtnHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "#fff",
        borderRadius: "5px",
        overflow: "hidden",
        position: "relative",
        transition: "",
        boxShadow: isHovered
          ? "0 1px 4px rgba(0,0,0,0.04)"
          : "",
        display: "flex",
        flexDirection: "column",
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
            padding: "3px 10px",
            borderRadius: "5px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {product.badge === "sale" && product.discount
            ? `-${product.discount}%`
            : product.badge}
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 2,
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: isWished ? "rgba(184,141,122,0.1)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(4px)",
          border: isWished ? "1px solid #b88d7a" : "1px solid #e8e5e2",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.2s ease",
          color: isWished ? "#b88d7a" : "#888",
        }}
        aria-label="Add to wishlist"
      >
        <Heart size={15} fill={isWished ? "#b88d7a" : "none"} />
      </button>

      {/* Product image */}
      <Link href={`/products/${product.id}`}>
        <div
          style={{
            position: "relative",
            paddingTop: "100%",
            overflow: "hidden",
            background: "#faf9f8",
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
            }}
          />
        </div>
      </Link>

      {/* Product Info */}
      <div
        style={{
          padding: "10px 16px 6px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Product Name */}
        <Link
          href={`/products/${product.id}`}
          style={{ textDecoration: "none" }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1a1a1a",
              marginBottom: "10px",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
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

        {/* Price + Rating row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#b88d7a",
              }}
            >
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  textDecoration: "line-through",
                }}
              >
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <StarRating rating={product.rating} reviewCount={product.reviewCount} size={13} />
        </div>
      </div>

      {/* Add to Cart Button — always visible */}
      <div style={{ padding: "8px 14px 14px", display: "flex", gap: "8px" }}>
        <button
          onClick={handleAddToCart}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            flex: 1,
            padding: "8px 0",
            background: addedToCart
              ? "#5a8a6a"
              : btnHovered
                ? "#fff"
                : "#1a1a1a",
            color: addedToCart
              ? "#fff"
              : btnHovered
                ? "#1a1a1a"
                : "#fff",
            border: addedToCart
              ? "1.5px solid #5a8a6a"
              : "1.5px solid #1a1a1a",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.25s ease",
            letterSpacing: "0.2px",
          }}
        >
          <ShoppingCart size={14} />
          {addedToCart ? "Added!" : "Add to Cart"}
        </button>
        <Link
          href={`/products/${product.id}`}
          onMouseEnter={() => setViewBtnHovered(true)}
          onMouseLeave={() => setViewBtnHovered(false)}
          style={{
            width: "38px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "5px",
            border: "1.5px solid #1a1a1a",
            background: viewBtnHovered ? "#1a1a1a" : "#fff",
            color: viewBtnHovered ? "#fff" : "#1a1a1a",
            transition: "all 0.25s ease",
            cursor: "pointer",
            textDecoration: "none",
          }}
          title="View Product"
        >
          <Eye size={15} />
        </Link>
      </div>
    </div>
  );
}
