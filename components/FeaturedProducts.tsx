"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { fetchProducts, type FetchProductsParams } from "@/lib/api";
import type { Product } from "@/types";

// Every tab is backed by real data: newest products, the ones the shop marks
// as featured, and those with a "was" price above the price.
const TABS: { id: string; label: string; query: FetchProductsParams; empty: string; more: string }[] = [
  { id: "new", label: "New in", query: { sort: "newest" }, empty: "New pieces are on the way.", more: "/products" },
  { id: "featured", label: "Featured", query: { featured: true }, empty: "Nothing featured right now.", more: "/products" },
  { id: "sale", label: "On sale", query: { badge: "sale" }, empty: "Nothing on sale right now.", more: "/products?sale=1" },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // Products for the tab they were loaded for; a different tab means loading.
  const [loaded, setLoaded] = useState<{ tab: string; products: Product[] } | null>(null);
  const loading = loaded?.tab !== activeTab;
  const products = loaded?.products ?? [];
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  useEffect(() => {
    let cancelled = false;
    const current = TABS.find((t) => t.id === activeTab) ?? TABS[0];
    fetchProducts({ limit: 8, sort: "newest", ...current.query })
      .then((data) => {
        if (!cancelled) setLoaded({ tab: activeTab, products: data.products });
      })
      .catch((err) => {
        console.error("FeaturedProducts fetch error:", err);
        if (!cancelled) setLoaded({ tab: activeTab, products: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <section className="mx-auto mb-14 max-w-[1280px] px-4" aria-labelledby="home-products-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id="home-products-heading" className="text-2xl font-bold text-[#1a1a1a]">
          Shop the collection
        </h2>

        <div role="tablist" aria-label="Show" className="flex gap-1 rounded bg-[#f5f5f5] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-[3px] px-4 py-1.5 text-[13px] transition-colors ${
                activeTab === t.id ? "bg-[#1a1a1a] font-semibold text-white" : "text-[#555] hover:text-[#1a1a1a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[5px] bg-white">
              <div className="animate-pulse bg-[#f5f5f5] pt-[100%]" />
              <div className="space-y-2.5 p-3.5">
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#f0f0f0]" />
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#f0f0f0]" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-base text-[#6b6b6b]">{tab.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mt-9 text-center">
        <Link
          href={tab.more}
          className="inline-flex items-center gap-2 rounded-sm border-2 border-[#1a1a1a] px-9 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          View all
        </Link>
      </div>
    </section>
  );
}
