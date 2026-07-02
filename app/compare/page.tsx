"use client";

import { useState } from "react";
import Link from "next/link";
import { X, GitCompare, ShoppingCart, Check } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import StarRating from "@/components/StarRating";
import { products } from "@/data";
import type { Product } from "@/types";

const compareProducts = products.slice(0, 3);
interface Spec {
  label: string;
  key: keyof Product;
  render?: (val: Product[keyof Product], product: Product) => React.ReactNode;
}

const SPECS: Spec[] = [
  { label: "Price", key: "price", render: (v) => `$${(v as number).toFixed(2)}` },
  { label: "Category", key: "category" },
  { label: "Rating", key: "rating", render: (_, p) => <StarRating rating={p.rating} reviewCount={p.reviewCount} /> },
  { label: "Availability", key: "id", render: () => <span style={{ color: "#28a745", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Check size={13} /> In Stock</span> },
  { label: "Badge", key: "badge", render: (v) => v ? (v as string).toUpperCase() : "—" },
];

export default function ComparePage() {
  const [items, setItems] = useState(compareProducts);
  const remove = (id: number) => setItems(prev => prev.filter(p => p.id !== id));

  return (
    <ShopLayout>
      <PageBreadcrumb title="Compare Products" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <GitCompare size={64} color="#e0e0e0" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>No products to compare</h2>
            <p style={{ color: "#888", marginBottom: "28px" }}>Add products to compare their features.</p>
            <Link href="/products" style={{ padding: "12px 32px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700 }}>Browse Products</Link>
          </div>
        ) : (
          <div className="bg-white border border-[#f0f0f0] rounded overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ width: "200px", padding: "16px 20px", textAlign: "left", background: "#f8f8f8", fontSize: "13px", fontWeight: 700, color: "#888", borderBottom: "1px solid #f0f0f0" }}>
                    Product
                  </th>
                  {items.map(product => (
                    <th key={product.id} style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", verticalAlign: "top", background: "#fff", position: "relative" }}>
                      <button onClick={() => remove(product.id)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "1px solid #e5e5e5", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
                        <X size={12} />
                      </button>
                      <img src={product.image} alt={product.name} style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "4px", marginBottom: "10px" }} />
                      <Link href={`/products/${product.id}`} style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1a1a1a", textDecoration: "none", marginBottom: "10px" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a")}
                      >{product.name}</Link>
                      <button style={{ padding: "8px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s", margin: "0 auto" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                      ><ShoppingCart size={12} /> Add to Cart</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPECS.map(({ label, key, render }) => (
                  <tr key={label} style={{ borderTop: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#666", background: "#f8f8f8", verticalAlign: "middle" }}>{label}</td>
                    {items.map(product => (
                      <td key={product.id} style={{ padding: "14px 20px", fontSize: "13px", color: "#1a1a1a", textAlign: "center", verticalAlign: "middle" }}>
                        {render
                          ? render(product[key], product)
                          : String(product[key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
