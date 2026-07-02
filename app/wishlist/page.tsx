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
              <div className="hidden md:grid grid-cols-[2.5fr_1fr_1fr_160px_40px] gap-3 px-5 py-3.5 bg-[#f8f8f8] border-b border-[#f0f0f0] text-xs font-bold text-[#888] tracking-wider uppercase">
                <span>Product</span><span className="text-center">Price</span><span className="text-center">Status</span><span /><span />
              </div>
              {wishlist.map((product) => (
                <div key={product.id} className="flex flex-col md:grid md:grid-cols-[2.5fr_1fr_1fr_160px_40px] gap-4 p-5 items-start md:items-center border-b border-[#f5f5f5] last:border-b-0 relative w-full">
                  <div className="flex items-center gap-3.5 w-full">
                    <Link href={`/products/${product.id}`} className="shrink-0">
                      <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded border border-[#f0f0f0]" />
                    </Link>
                    <div>
                      <Link href={`/products/${product.id}`} className="text-sm font-semibold text-[#1a1a1a] no-underline hover:text-[#b88d7a] transition-colors">{product.name}</Link>
                      <div className="mt-1"><StarRating rating={product.rating} reviewCount={product.reviewCount} size={12} /></div>
                    </div>
                  </div>
                  <div className="flex md:justify-center items-center w-full md:w-auto">
                    <span className="text-xs font-semibold text-[#888] mr-3 md:hidden">Price:</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">${product.price.toFixed(2)}</span>
                    {product.originalPrice && <span className="text-xs text-[#aaa] line-through ml-2">${product.originalPrice.toFixed(2)}</span>}
                  </div>
                  <div className="flex md:justify-center items-center w-full md:w-auto">
                    <span className="text-xs font-semibold text-[#888] mr-3 md:hidden">Status:</span>
                    <span className="text-[10px] px-2.5 py-1 bg-[#dcf5e7] text-[#28a745] rounded-full font-bold uppercase tracking-wider">In Stock</span>
                  </div>
                  <button className="w-full md:w-auto py-2 px-3.5 bg-[#1a1a1a] hover:bg-[#b88d7a] text-white border-none rounded cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <ShoppingCart size={13} /> Add to Cart
                  </button>
                  <button onClick={() => remove(product.id)} className="absolute top-5 right-5 md:static bg-none border-none cursor-pointer text-[#ccc] hover:text-red-500 transition-colors flex items-center justify-center" aria-label="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ShopLayout>
  );
}
