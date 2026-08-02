"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Eye, X, Minus, Plus } from "lucide-react";
import StarRating from "./StarRating";
import type { Product } from "@/types";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [viewBtnHovered, setViewBtnHovered] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const defaultSizes = ["S", "M", "L", "XL"];
  const defaultColors = ["Black", "White", "Brown"];
  const sizes: string[] = product.sizes?.length
    ? product.sizes
    : (product.variants?.map((v) => v.size).filter((s): s is string => Boolean(s))?.length ?? 0) > 0
    ? Array.from(new Set(product.variants!.map((v) => v.size).filter((s): s is string => Boolean(s))))
    : defaultSizes;
  const colors: string[] = product.colors?.length
    ? product.colors
    : (product.variants?.map((v) => v.color).filter((c): c is string => Boolean(c))?.length ?? 0) > 0
    ? Array.from(new Set(product.variants!.map((v) => v.color).filter((c): c is string => Boolean(c))))
    : defaultColors;

  const openModal = () => {
    setSelectedSize(sizes[0]);
    setSelectedColor(colors[0]);
    setQuantity(1);
    setShowModal(true);
  };

  const confirmAddToCart = () => {
    // Find matching variant by selected size/color
    const matchingVariant = product.variants?.find(
      (v) =>
        (v.size || null) === (selectedSize || null) &&
        (v.color || null) === (selectedColor || null)
    );
    const unitPrice = matchingVariant?.priceOverride
      ? Number(matchingVariant.priceOverride)
      : Number(product.price);
    const mainImage = product.images?.[0]?.imageUrl || product.image || null;

    addItem(product.id, matchingVariant?.id || null, quantity, {
      productName: product.name,
      unitPrice,
      image: mainImage,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      productSlug: product.slug,
    });
    setShowModal(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };



  const badgeColors: Record<string, { bg: string; color: string }> = {
    sale: { bg: "#b88d7a", color: "#fff" },
    new: { bg: "#5a8a6a", color: "#fff" },
    hot: { bg: "#c45b5b", color: "#fff" },
  };

  return (
    <>
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



        {/* Product image */}
        <Link href={`/products/${product.slug}`}>
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
              src={product.image || "/placeholder-product.png"}
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
            href={`/products/${product.slug}`}
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
                {formatNGN(product.price)}
              </span>
              {product.originalPrice && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#aaa",
                    textDecoration: "line-through",
                  }}
                >
                  {formatNGN(product.originalPrice)}
                </span>
              )}
            </div>

            <StarRating rating={product.rating} reviewCount={product.reviewCount} size={13} />
          </div>
        </div>

        {/* Add to Cart Button — opens modal */}
        <div style={{ padding: "8px 14px 14px", display: "flex", gap: "8px" }}>
          <button
            onClick={openModal}
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
            href={`/products/${product.slug}`}
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

      {/* === Add to Cart Modal === */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "fadeInScale 0.25s ease",
              overflow: "hidden",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 2,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.06)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                transition: "background 0.2s",
              }}
            >
              <X size={16} />
            </button>

            {/* Product preview */}
            <div style={{ display: "flex", gap: "14px", padding: "20px 20px 16px", alignItems: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "#faf9f8",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image || "/placeholder-product.png"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.3 }}>
                  {product.name}
                </p>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#b88d7a", margin: 0 }}>
                  {formatNGN(product.price)}
                </p>
              </div>
            </div>

            <div style={{ padding: "0 20px 20px" }}>
              {/* Divider */}
              <div style={{ height: "1px", background: "#f0f0f0", marginBottom: "16px" }} />

              {/* Size selector */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Size
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "5px",
                        border: selectedSize === size ? "1.5px solid #1a1a1a" : "1.5px solid #e0e0e0",
                        background: selectedSize === size ? "#1a1a1a" : "#fff",
                        color: selectedSize === size ? "#fff" : "#333",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Color
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "5px",
                        border: selectedColor === color ? "1.5px solid #b88d7a" : "1.5px solid #e0e0e0",
                        background: selectedColor === color ? "#b88d7a" : "#fff",
                        color: selectedColor === color ? "#fff" : "#333",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Quantity
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    style={{
                      width: "44px",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      borderLeft: "1.5px solid #e0e0e0",
                      borderRight: "1.5px solid #e0e0e0",
                      lineHeight: "36px",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Confirm button */}
              <button
                onClick={confirmAddToCart}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                  letterSpacing: "0.3px",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#333"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; }}
              >
                <ShoppingCart size={15} />
                Add to Cart — {formatNGN(product.price * quantity)}
              </button>
            </div>
          </div>

          {/* Animation keyframes */}
          <style>{`
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
