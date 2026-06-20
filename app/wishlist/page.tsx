"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import StarRating from "@/components/StarRating";
import { products } from "@/data";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(products.slice(0, 6));

  const remove = (id: number) => setWishlist(w => w.filter(p => p.id !== id));

  return (
    <ShopLayout>
      <PageBreadcrumb title="Wishlist" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Heart size={64} color="#e0e0e0" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>Your wishlist is empty</h2>
            <p style={{ color: "#888", marginBottom: "28px" }}>Save items you love to your wishlist.</p>
            <Link href="/products" style={{ padding: "12px 32px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700 }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", color: "#888" }}>
                <strong style={{ color: "#1a1a1a" }}>{wishlist.length}</strong> items in your wishlist
              </h2>
              <button onClick={() => setWishlist([])}
                style={{ padding: "8px 16px", border: "1px solid #e5e5e5", borderRadius: "3px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#888", fontWeight: 500 }}>
                Clear All
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 160px 40px", gap: "12px", padding: "14px 20px", background: "#f8f8f8", borderBottom: "1px solid #f0f0f0", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                <span>Product</span><span style={{ textAlign: "center" }}>Price</span><span style={{ textAlign: "center" }}>Status</span><span /><span />
              </div>
              {wishlist.map((product, idx) => (
                <div key={product.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 160px 40px", gap: "12px", padding: "20px", alignItems: "center", borderBottom: idx < wishlist.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link href={`/products/${product.id}`}>
                      <img src={product.image} alt={product.name} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "4px", border: "1px solid #f0f0f0" }} />
                    </Link>
                    <div>
                      <Link href={`/products/${product.id}`} style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", textDecoration: "none" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a")}
                      >{product.name}</Link>
                      <div style={{ marginTop: "4px" }}><StarRating rating={product.rating} reviewCount={product.reviewCount} size={12} /></div>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>${product.price.toFixed(2)}</span>
                    {product.originalPrice && <div style={{ fontSize: "12px", color: "#aaa", textDecoration: "line-through" }}>${product.originalPrice.toFixed(2)}</div>}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "11px", padding: "3px 10px", background: "#dcf5e7", color: "#28a745", borderRadius: "20px", fontWeight: 700 }}>In Stock</span>
                  </div>
                  <button style={{ padding: "9px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                  >
                    <ShoppingCart size={13} /> Add to Cart
                  </button>
                  <button onClick={() => remove(product.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f44336")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ccc")}
                  ><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ShopLayout>
  );
}
