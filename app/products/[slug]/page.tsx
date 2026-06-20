"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, GitCompare, Share2, ShoppingCart, Zap, Minus, Plus, Star, Facebook, Twitter, Linkedin, Check } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import { products } from "@/data";

const PRODUCT = {
  id: "saute-pan-silver",
  name: "Saute Pan Silver",
  price: 441.00,
  sku: "NC-161-A0",
  brand: "Anfold",
  category: "Silk Accessories",
  rating: 4,
  reviewCount: 7,
  inStock: true,
  description: "Short Hooded Coat features a straight body, large pockets with button flaps, ventilation air holes, and a string detail along the hemline. This premium quality item is crafted with the finest materials for lasting durability and style.",
  colors: ["Red", "Black"],
  sizes: ["S", "XL"],
  tags: ["Printer", "Office", "IT"],
  images: Array.from({ length: 9 }, (_, i) => `https://placehold.co/720x720/${["f5ece0", "e0f5ec", "e0ecf5", "f5e0ec", "ecf5e0", "f5f5e0", "e0f5f5", "f5e0f5", "ece0f5"][i]}/999?text=Product+${i + 1}`),
};

const REVIEWS = [
  { id: 1, name: "Alice M.", rating: 5, date: "Jun 12, 2025", comment: "Absolutely love this product! The quality is outstanding and it arrived quickly. Would definitely recommend to anyone looking for a premium item.", avatar: "https://placehold.co/48x48/e0ecf5/666?text=A" },
  { id: 2, name: "Bob K.", rating: 4, date: "May 28, 2025", comment: "Great product overall. The color matches exactly what was shown online. Only minor issue was the packaging, but the product itself is perfect.", avatar: "https://placehold.co/48x48/f5e0ec/666?text=B" },
  { id: 3, name: "Carol T.", rating: 5, date: "Apr 15, 2025", comment: "This exceeded my expectations! Beautiful craftsmanship and exactly what I needed. Will be buying more from this brand.", avatar: "https://placehold.co/48x48/ecf5e0/666?text=C" },
  { id: 4, name: "David R.", rating: 3, date: "Mar 20, 2025", comment: "Decent product for the price. Delivery was a bit slow but the item itself is good quality. Might order again.", avatar: "https://placehold.co/48x48/f5f5e0/666?text=D" },
];

export default function ProductDetailPage() {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(PRODUCT.colors[0]);
  const [selectedSize, setSelectedSize] = useState(PRODUCT.sizes[0]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", email: "", rating: 5, comment: "" });

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title={PRODUCT.name} crumbs={[{ label: "Products", href: "/products" }, { label: PRODUCT.category, href: `/category/${PRODUCT.category}` }]} />

      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {/* Top: Gallery + Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "56px" }}>

          {/* Gallery */}
          <div>
            {/* Main image */}
            <div style={{ position: "relative", borderRadius: "6px", overflow: "hidden", marginBottom: "14px", background: "#fafafa", border: "1px solid #f0f0f0", aspectRatio: "1" }}>
              <img src={PRODUCT.images[activeImg]} alt={PRODUCT.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }} />
            </div>
            {/* Thumbnails */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {PRODUCT.images.slice(0, 9).map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{ aspectRatio: "1", border: `2px solid ${activeImg === i ? "#f57224" : "#e5e5e5"}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer", padding: 0, background: "none", transition: "border-color 0.2s" }}>
                  <img src={img} alt={`Thumbnail ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Rating + Reviews */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <StarRating rating={PRODUCT.rating} />
              <Link href="#reviews" style={{ fontSize: "13px", color: "#f57224", textDecoration: "none" }}>{PRODUCT.reviewCount} Reviews</Link>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2, marginBottom: "10px" }}>
              {PRODUCT.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#dcf5e7", color: "#28a745", borderRadius: "2px", letterSpacing: "0.5px" }}>
                {PRODUCT.inStock ? "✓ IN STOCK" : "OUT OF STOCK"}
              </span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: "32px", fontWeight: 800, color: "#1a1a1a" }}>${PRODUCT.price.toFixed(2)}</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.8, marginBottom: "24px" }}>
              {PRODUCT.description}
            </p>

            {/* Color */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Color:</span>
                <span style={{ fontSize: "13px", color: "#f57224", fontWeight: 600 }}>{selectedColor}</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {PRODUCT.colors.map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)}
                    style={{
                      padding: "7px 18px", borderRadius: "3px", cursor: "pointer",
                      border: `2px solid ${selectedColor === color ? "#f57224" : "#e5e5e5"}`,
                      background: selectedColor === color ? "#fff8f5" : "#fff",
                      color: selectedColor === color ? "#f57224" : "#555",
                      fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
                    }}>
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Size:</span>
                <span style={{ fontSize: "13px", color: "#f57224", fontWeight: 600 }}>{selectedSize}</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {PRODUCT.sizes.map(size => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: "48px", padding: "7px 14px", borderRadius: "3px", cursor: "pointer",
                      border: `2px solid ${selectedSize === size ? "#f57224" : "#e5e5e5"}`,
                      background: selectedSize === size ? "#f57224" : "#fff",
                      color: selectedSize === size ? "#fff" : "#555",
                      fontSize: "13px", fontWeight: 700, transition: "all 0.2s",
                    }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Buttons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
              {/* Qty */}
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e5e5", borderRadius: "3px", overflow: "hidden" }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: "40px", height: "48px", border: "none", background: "#f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
                  <Minus size={14} />
                </button>
                <span style={{ width: "52px", textAlign: "center", fontSize: "15px", fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  style={{ width: "40px", height: "48px", border: "none", background: "#f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
                  <Plus size={14} />
                </button>
              </div>

              <button onClick={handleAddToCart}
                style={{ flex: 1, height: "48px", background: addedToCart ? "#28a745" : "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 700, fontSize: "14px", transition: "background 0.2s" }}>
                {addedToCart ? <><Check size={16} /> Added to Cart</> : <><ShoppingCart size={16} /> Add To Cart</>}
              </button>

              <button style={{ height: "48px", padding: "0 18px", background: "#f57224", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}>
                <Zap size={16} /> Buy Now
              </button>
            </div>

            {/* Secondary actions */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
              <button onClick={() => setWishlisted(!wishlisted)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: wishlisted ? "#f57224" : "#666", fontWeight: 500 }}>
                <Heart size={16} fill={wishlisted ? "#f57224" : "none"} /> Wishlist
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#666", fontWeight: 500 }}>
                <GitCompare size={16} /> Compare
              </button>
            </div>

            {/* Meta */}
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "SKU", value: PRODUCT.sku },
                { label: "Brand", value: PRODUCT.brand },
                { label: "Categories", value: PRODUCT.category },
                { label: "Tags", value: PRODUCT.tags.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                  <span style={{ fontWeight: 700, color: "#1a1a1a", minWidth: "80px" }}>{label}:</span>
                  <span style={{ color: "#666" }}>{value}</span>
                </div>
              ))}
              {/* Share */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "13px" }}>Share:</span>
                {[
                  { Icon: Facebook, color: "#1877F2" },
                  { Icon: Twitter, color: "#1da1f2" },
                  { Icon: Linkedin, color: "#0077b5" },
                ].map(({ Icon, color }, i) => (
                  <button key={i} style={{ width: "30px", height: "30px", borderRadius: "50%", background: color, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description | Reviews */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: "32px", gap: "0" }}>
            {["description", "reviews"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 28px", border: "none", background: "none", cursor: "pointer",
                  fontSize: "15px", fontWeight: 700, textTransform: "capitalize",
                  color: activeTab === tab ? "#1a1a1a" : "#888",
                  borderBottom: `3px solid ${activeTab === tab ? "#f57224" : "transparent"}`,
                  marginBottom: "-2px", transition: "all 0.2s",
                }}>
                {tab}{tab === "reviews" ? ` (${REVIEWS.length})` : ""}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div style={{ maxWidth: "860px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "16px" }}>Product Description</h3>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.9, marginBottom: "16px" }}>
                {PRODUCT.description} This exceptional item is designed to meet the highest standards of quality and craftsmanship. Whether you&apos;re looking for everyday use or a special occasion, this product delivers on all fronts.
              </p>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.9 }}>
                Our skilled artisans put great care into every detail, ensuring that each piece meets our rigorous quality standards. Made from sustainable materials, this product is not only beautiful but also environmentally responsible.
              </p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div id="reviews">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
                {/* Reviews list */}
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "24px" }}>{REVIEWS.length} Reviews</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {REVIEWS.map(review => (
                      <div key={review.id} style={{ display: "flex", gap: "16px", paddingBottom: "24px", borderBottom: "1px solid #f0f0f0" }}>
                        <img src={review.avatar} alt={review.name} style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{review.name}</span>
                            <span style={{ fontSize: "12px", color: "#aaa" }}>{review.date}</span>
                          </div>
                          <StarRating rating={review.rating} size={13} />
                          <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7, marginTop: "8px" }}>{review.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review form */}
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "24px" }}>Leave a Review</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>Your Rating</label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                            <Star size={22} fill={star <= reviewForm.rating ? "#ffc107" : "none"} color={star <= reviewForm.rating ? "#ffc107" : "#d0d0d0"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {[
                      { label: "Your Name", key: "name", type: "text", placeholder: "John Doe" },
                      { label: "Email", key: "email", type: "email", placeholder: "your@email.com" },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>{label}</label>
                        <input type={type} placeholder={placeholder}
                          value={reviewForm[key as keyof typeof reviewForm] as string}
                          onChange={(e) => setReviewForm({ ...reviewForm, [key]: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "3px", fontSize: "14px", outline: "none" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>Comment</label>
                      <textarea rows={4} placeholder="Share your experience with this product..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "3px", fontSize: "14px", outline: "none", resize: "vertical" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                      />
                    </div>
                    <button style={{ padding: "12px 24px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 700, fontSize: "14px", alignSelf: "flex-start", transition: "background 0.2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "24px" }}>Related Products</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
