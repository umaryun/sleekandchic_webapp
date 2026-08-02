"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, Grid, List, ChevronDown, ChevronRight, ChevronLeft, X } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import { fetchProducts, fetchCategories, type FetchProductsParams } from "@/lib/api";
import type { Product, Category, PaginationMeta } from "@/types";
import { formatNGN } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", api: "newest" as const },
  { value: "price-asc", label: "Price: Low to High", api: "price_asc" as const },
  { value: "price-desc", label: "Price: High to Low", api: "price_desc" as const },
  { value: "name-az", label: "Name: A-Z", api: "name" as const },
  { value: "rating-desc", label: "Rating: High to Low", api: "rating" as const },
];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", marginBottom: "16px" }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 0 12px", fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>
        {title}
        <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [perPage, setPerPage] = useState(20);
  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>(initialCategory);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);

  // Fetch categories once
  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Categories fetch error:", err))
      .finally(() => setCatsLoading(false));
  }, []);

  // Fetch products whenever filters/sort/page change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sortOption = SORT_OPTIONS.find((o) => o.value === sort);
      const params: FetchProductsParams = {
        page,
        limit: perPage,
        sort: sortOption?.api || "newest",
      };

      if (selectedCat) params.category = selectedCat;
      if (onSaleOnly) params.badge = "sale";
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await fetchProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sort, selectedCat, onSaleOnly, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCat, onSaleOnly, sort, perPage, searchQuery]);

  const totalProducts = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const currentSort = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Newest";

  const selectCat = (slug: string) => {
    setSelectedCat(selectedCat === slug ? "" : slug);
  };

  const clearFilters = () => {
    setSelectedCat("");
    setOnSaleOnly(false);
    setSearchQuery("");
  };

  const hasFilters = selectedCat || onSaleOnly || searchQuery;

  const renderSidebar = () => (
    <aside style={{ width: "260px", flexShrink: 0 }}>
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>Filter Products</h3>
          {hasFilters ? (
            <button onClick={clearFilters}
              style={{ fontSize: "11px", color: "#f57224", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Clear All
            </button>
          ) : null}
        </div>

        {/* Sort By */}
        <FilterSection title="Sort By">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {SORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: sort === opt.value ? "#f57224" : "#555",
                  fontWeight: sort === opt.value ? 600 : 400,
                }}
              >
                <input
                  type="radio"
                  name="sortOption"
                  value={opt.value}
                  checked={sort === opt.value}
                  onChange={() => setSort(opt.value)}
                  style={{ accentColor: "#f57224", width: "14px", height: "14px" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Search */}
        <FilterSection title="Search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "4px",
              fontSize: "13px",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
          />
        </FilterSection>

        {/* Categories */}
        <FilterSection title="Categories">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {catsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: "18px", background: "#f0f0f0", borderRadius: "4px", width: `${60 + Math.random() * 40}%` }} className="animate-pulse" />
              ))
            ) : (
              categories.map(cat => (
                <label key={cat.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: selectedCat === cat.slug ? "#f57224" : "#555" }}>
                  <input type="checkbox" checked={selectedCat === cat.slug} onChange={() => selectCat(cat.slug)}
                    style={{ accentColor: "#f57224", width: "14px", height: "14px" }} />
                  {cat.name}
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>({cat.productCount ?? 0})</span>
                </label>
              ))
            )}
          </div>
        </FilterSection>

        {/* On Sale */}
        <FilterSection title="On Sale">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: onSaleOnly ? "#f57224" : "#555" }}>
            <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)}
              style={{ accentColor: "#f57224", width: "14px", height: "14px" }} />
            Show only discounted products
          </label>
        </FilterSection>
      </div>
    </aside>
  );

  return (
    <ShopLayout>
      <PageBreadcrumb title="Products" crumbs={[]} />

      <div className="w-full max-w-[1280px] my-6 sm:my-8 mx-auto px-4 flex gap-7 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">{renderSidebar()}</div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 bg-white border border-[#f0f0f0] rounded-md p-2  sm:p-4">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {/* Mobile filter */}
              <button onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a1a1a] text-white rounded text-xs font-semibold cursor-pointer">
                <SlidersHorizontal size={14} /> Filter
              </button>
              <span className="text-xs sm:text-sm text-[#888]">
                <strong className="text-[#1a1a1a]">{totalProducts}</strong> Products found
              </span>
              <div style={{ display: "flex", border: "1px solid #e5e5e5", borderRadius: "3px", overflow: "hidden" }}>
                {(["grid", "list"] as const).map((v) => (
                  <button key={v} onClick={() => setLayout(v)}
                    style={{ padding: "7px 10px", background: layout === v ? "#1a1a1a" : "#fff", color: layout === v ? "#fff" : "#888", border: "none", cursor: "pointer", display: "flex", alignItems: "center", transition: "background 0.2s" }}>
                    {v === "grid" ? <Grid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-[18px]">
              {Array.from({ length: perPage > 12 ? 12 : perPage }).map((_, i) => (
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
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>No products found</p>
              <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>Try adjusting your filters or search query.</p>
              {hasFilters && (
                <button onClick={clearFilters}
                  style={{ padding: "10px 24px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                  Clear All Filters
                </button>
              )}
            </div>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-[18px]">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 sm:gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-row gap-3 sm:gap-5 bg-white border border-[#f0f0f0] rounded-md p-3 sm:p-4 hover:shadow-md transition-shadow items-center sm:items-start"
                >
                  <Link href={`/products/${product.slug}`} className="shrink-0 relative block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image || "/placeholder-product.png"}
                      alt={product.name}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-md border border-[#f0f0f0]"
                    />
                    {product.badge && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f57224] text-white uppercase z-10 shadow-xs">
                        {product.badge === "sale" && product.discount ? `-${product.discount}%` : product.badge}
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${product.slug}`} className="no-underline">
                        <h3 className="text-xs sm:text-base font-semibold text-[#1a1a1a] mb-1 line-clamp-2 hover:text-[#f57224] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                    </div>

                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-lg font-bold text-[#1a1a1a]">{formatNGN(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-[11px] sm:text-sm text-[#aaa] line-through">{formatNGN(product.originalPrice)}</span>
                        )}
                      </div>
                      <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#1a1a1a] hover:bg-[#f57224] text-white border-0 rounded text-[11px] sm:text-xs font-semibold cursor-pointer transition-colors w-fit sm:w-auto">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-9 sm:mt-12 flex-wrap">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 border border-[#e5e5e5] rounded bg-white text-[#555] disabled:text-[#ccc] disabled:cursor-not-allowed hover:enabled:bg-[#f8f8f8] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 border rounded text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      page === p
                        ? "border-[#f57224] bg-[#f57224] text-white"
                        : "border-[#e5e5e5] bg-white text-[#555] hover:bg-[#f8f8f8]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 border border-[#e5e5e5] rounded bg-white text-[#555] disabled:text-[#ccc] disabled:cursor-not-allowed hover:enabled:bg-[#f8f8f8] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <>
          <div onClick={() => setMobileFilterOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} />
          <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "300px", background: "#fff", zIndex: 70, overflowY: "auto", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: 700 }}>Filter Products</h3>
              <button onClick={() => setMobileFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            {renderSidebar()}
          </div>
        </>
      )}
    </ShopLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <ShopLayout>
          <PageBreadcrumb title="Products" crumbs={[]} />
          <div style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 16px" }}>
            <div className="animate-pulse flex gap-6">
              <div className="hidden lg:block w-[260px] h-[400px] bg-neutral-100 rounded" />
              <div className="flex-1 h-[600px] bg-neutral-100 rounded" />
            </div>
          </div>
        </ShopLayout>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
