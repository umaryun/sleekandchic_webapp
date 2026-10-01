"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, ChevronRight, ChevronLeft, X } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, fetchCategories, type FetchProductsParams } from "@/lib/api";
import type { Product, Category, PaginationMeta } from "@/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 350;

interface Filters {
  category: string;
  search: string;
  sort: SortValue;
  sale: boolean;
  page: number;
}

/** The URL is the single source of truth for filters, so links can be shared and Back works. */
function readFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort");
  return {
    category: params.get("category") ?? "",
    search: params.get("search") ?? "",
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortValue) : "newest",
    sale: params.get("sale") === "1",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = readFilters(new URLSearchParams(queryString));

  const setFilters = useCallback(
    (changes: Partial<Record<keyof Filters, string | null>>) => {
      const next = new URLSearchParams(queryString);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // Any filter change goes back to the first page.
      if (!("page" in changes)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [queryString, pathname, router]
  );

  // The search box updates the URL once typing pauses. When the URL changes
  // from elsewhere (header search, Back), the box follows it.
  const [searchInput, setSearchInput] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchInput(filters.search);
  }
  useEffect(() => {
    if (searchInput.trim() === syncedSearch) return;
    const timer = setTimeout(() => setFilters({ search: searchInput.trim() || null }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput, syncedSearch, setFilters]);

  const [categories, setCategories] = useState<Category[] | null>(null);
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const [result, setResult] = useState<{
    key: string;
    products: Product[];
    pagination: PaginationMeta | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    const f = readFilters(new URLSearchParams(queryString));
    const params: FetchProductsParams = { page: f.page, limit: PAGE_SIZE, sort: f.sort };
    if (f.category) params.category = f.category;
    if (f.search) params.search = f.search;
    if (f.sale) params.badge = "sale";
    let cancelled = false;
    fetchProducts(params)
      .then((data) => !cancelled && setResult({ key: queryString, products: data.products, pagination: data.pagination, failed: false }))
      .catch(() => !cancelled && setResult({ key: queryString, products: [], pagination: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const loading = result?.key !== queryString;
  const products = result?.products ?? [];
  const totalProducts = result?.pagination?.total ?? 0;
  const totalPages = result?.pagination?.totalPages ?? 1;
  const hasFilters = Boolean(filters.category || filters.search || filters.sale);
  const activeCategory = categories?.find((c) => c.slug === filters.category);

  const clearFilters = () => {
    setSearchInput("");
    setFilters({ category: null, search: null, sale: null });
  };

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="shop-search" className="block text-sm font-bold text-[#1a1a1a] mb-2">
          Search
        </label>
        <input
          id="shop-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Abaya, kaftan, colour…"
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-sm outline-none focus:border-[#1a1a1a]"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-[#1a1a1a] mb-2">Category</legend>
        <div className="flex flex-col gap-2">
          {categories === null
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[18px] bg-[#f0f0f0] rounded animate-pulse" />)
            : [{ id: "all", slug: "", name: "All products", productCount: undefined } as Category, ...categories].map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 cursor-pointer text-[13px] ${filters.category === cat.slug ? "text-[#1a1a1a] font-semibold" : "text-[#555]"}`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === cat.slug}
                    onChange={() => setFilters({ category: cat.slug || null })}
                    className="accent-[#1a1a1a] w-3.5 h-3.5"
                  />
                  {cat.name}
                  {cat.productCount !== undefined && <span className="ml-auto text-[11px] text-[#999]">{cat.productCount}</span>}
                </label>
              ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#555]">
        <input
          type="checkbox"
          checked={filters.sale}
          onChange={(e) => setFilters({ sale: e.target.checked ? "1" : null })}
          className="accent-[#1a1a1a] w-3.5 h-3.5"
        />
        On sale only
      </label>

      {hasFilters && (
        <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-[#8a6452] underline cursor-pointer">
          Clear all filters
        </button>
      )}
    </div>
  );

  const pageNumbers = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7 || filters.page <= 4) return i + 1;
    if (filters.page >= totalPages - 3) return totalPages - 6 + i;
    return filters.page - 3 + i;
  });

  return (
    <>
      <PageBreadcrumb title={activeCategory?.name ?? (filters.search ? `Search: ${filters.search}` : "Shop")} crumbs={[]} />

      <div className="w-full max-w-[1280px] my-6 sm:my-8 mx-auto px-4 flex gap-7 items-start">
        <aside className="hidden lg:block w-[240px] shrink-0 bg-white border border-[#f0f0f0] rounded p-5" aria-label="Filters">
          {filterPanel}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a1a] text-white rounded text-xs font-semibold cursor-pointer"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>
              <p className="text-sm text-[#777]" aria-live="polite">
                {loading ? "Loading…" : `${totalProducts} ${totalProducts === 1 ? "product" : "products"}`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#555]">
              Sort
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ sort: e.target.value === "newest" ? null : e.target.value })}
                className="px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-[18px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[5px] overflow-hidden">
                  <div className="pt-[100%] bg-[#f5f5f5] animate-pulse" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-[#f0f0f0] rounded w-4/5 animate-pulse" />
                    <div className="h-3.5 bg-[#f0f0f0] rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : result?.failed ? (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-[#1a1a1a] mb-2">We couldn&apos;t load products</p>
              <button type="button" onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded text-sm font-semibold">
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-5">
              <p className="text-lg font-semibold text-[#1a1a1a] mb-2">No products found</p>
              <p className="text-sm text-[#888] mb-6">
                {filters.search ? `Nothing matches "${filters.search}".` : "Nothing matches these filters."} Try a different search or category.
              </p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded text-sm font-semibold cursor-pointer">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-[18px]">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-center gap-1.5 sm:gap-2 mt-9 sm:mt-12 flex-wrap">
              <button
                type="button"
                onClick={() => setFilters({ page: String(filters.page - 1) })}
                disabled={filters.page === 1}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 border border-[#e5e5e5] rounded bg-white text-[#555] disabled:text-[#ccc] disabled:cursor-not-allowed text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilters({ page: p === 1 ? null : String(p) })}
                  aria-current={filters.page === p ? "page" : undefined}
                  className={`w-9 h-9 border rounded text-sm font-bold cursor-pointer ${
                    filters.page === p ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e5e5e5] bg-white text-[#555] hover:bg-[#f8f8f8]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilters({ page: String(filters.page + 1) })}
                disabled={filters.page === totalPages}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 border border-[#e5e5e5] rounded bg-white text-[#555] disabled:text-[#ccc] disabled:cursor-not-allowed text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </nav>
          )}
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-white overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1a1a1a]">Filters</h2>
              <button type="button" onClick={() => setMobileFilterOpen(false)} aria-label="Close filters" className="cursor-pointer">
                <X size={20} />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-3 bg-[#1a1a1a] text-white rounded text-sm font-bold cursor-pointer"
            >
              Show {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <ShopLayout>
      <Suspense
        fallback={
          <div className="max-w-[1280px] mx-auto my-8 px-4 animate-pulse flex gap-6">
            <div className="hidden lg:block w-[240px] h-[400px] bg-neutral-100 rounded" />
            <div className="flex-1 h-[600px] bg-neutral-100 rounded" />
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </ShopLayout>
  );
}
