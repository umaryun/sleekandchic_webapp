"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SlidersHorizontal, Grid, List, ChevronDown, ChevronRight, X, Star } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import { products, categories } from "@/data";
import type { Product } from "@/types";

const BRANDS = ["Fashion Live", "Hand Crafted", "Mestonix", "Sunshine", "Pure", "Anfold"];
const TAGS = ["Office", "Mobile", "Printer", "Iphone", "IT", "Electronic"];
const COLORS = [
  { name: "Green", hex: "#4caf50" },
  { name: "Blue", hex: "#2196f3" },
  { name: "Red", hex: "#f44336" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Brown", hex: "#795548" },
];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-az", label: "Name: A-Z" },
  { value: "name-za", label: "Name: Z-A" },
  { value: "rating-asc", label: "Rating: Low to High" },
  { value: "rating-desc", label: "Rating: High to Low" },
];

// Expand mock product list to 75 items
const allProducts: Product[] = Array.from({ length: 75 }, (_, i) => ({
  ...products[i % products.length],
  id: i + 1,
  name: products[i % products.length].name + (i >= products.length ? ` #${Math.floor(i / products.length) + 1}` : ""),
}));

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

export default function ProductsPage() {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [perPage, setPerPage] = useState(20);
  const [sort, setSort] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);

  const filtered = useMemo(() => {
    let out = [...allProducts];
    if (selectedCats.length) out = out.filter(p => selectedCats.includes(p.category));
    if (onSaleOnly) out = out.filter(p => p.badge === "sale");
    if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
    else if (sort === "name-az") out.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name-za") out.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "rating-asc") out.sort((a, b) => a.rating - b.rating);
    else if (sort === "rating-desc") out.sort((a, b) => b.rating - a.rating);
    return out;
  }, [selectedCats, onSaleOnly, sort]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const currentSort = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Default";

  const toggleCat = (cat: string) => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleBrand = (b: string) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleColor = (c: string) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const renderSidebar = () => (
    <aside style={{ width: "260px", flexShrink: 0 }}>
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>Filter Products</h3>
          {(selectedCats.length || selectedBrands.length || selectedColors.length || selectedSizes.length || onSaleOnly) ? (
            <button onClick={() => { setSelectedCats([]); setSelectedBrands([]); setSelectedColors([]); setSelectedSizes([]); setOnSaleOnly(false); }}
              style={{ fontSize: "11px", color: "#f57224", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Clear All
            </button>
          ) : null}
        </div>

        {/* Categories */}
        <FilterSection title="Categories">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categories.map(cat => (
              <label key={cat.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: selectedCats.includes(cat.name) ? "#f57224" : "#555" }}>
                <input type="checkbox" checked={selectedCats.includes(cat.name)} onChange={() => toggleCat(cat.name)}
                  style={{ accentColor: "#f57224", width: "14px", height: "14px" }} />
                {cat.name}
                {cat.children && <ChevronRight size={12} color="#ccc" />}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Brands">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {BRANDS.map(brand => (
              <label key={brand} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: selectedBrands.includes(brand) ? "#f57224" : "#555" }}>
                <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)}
                  style={{ accentColor: "#f57224", width: "14px", height: "14px" }} />
                {brand}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Tags */}
        <FilterSection title="Tags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TAGS.map(tag => (
              <button key={tag} style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
                border: "1px solid #e5e5e5", cursor: "pointer",
                background: "#fafafa", color: "#555",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f57224"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#f57224"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fafafa"; (e.currentTarget as HTMLButtonElement).style.color = "#555"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e5e5"; }}
              >
                {tag}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price */}
        <FilterSection title="Price">
          <div style={{ padding: "0 4px" }}>
            <input type="range" min={0} max={500} value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              style={{ width: "100%", accentColor: "#f57224" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginTop: "6px" }}>
              <span>$0</span><span>${priceRange[1]}</span>
            </div>
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

        {/* Color */}
        <FilterSection title="Color">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {COLORS.map(({ name, hex }) => (
              <button key={name} title={name} onClick={() => toggleColor(name)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%", background: hex,
                  border: selectedColors.includes(name) ? "3px solid #f57224" : "2px solid #e5e5e5",
                  cursor: "pointer", transition: "border 0.2s",
                }} />
            ))}
          </div>
        </FilterSection>

        {/* Size */}
        <FilterSection title="Size" defaultOpen={true}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SIZES.map(size => (
              <button key={size} onClick={() => toggleSize(size)}
                style={{
                  minWidth: "40px", padding: "5px 10px", border: "1px solid",
                  borderColor: selectedSizes.includes(size) ? "#f57224" : "#e5e5e5",
                  background: selectedSizes.includes(size) ? "#f57224" : "#fff",
                  color: selectedSizes.includes(size) ? "#fff" : "#555",
                  borderRadius: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                  transition: "all 0.2s",
                }}>
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );

  return (
    <ShopLayout>
      <PageBreadcrumb title="Products" crumbs={[]} />

      <div style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 16px", display: "flex", gap: "28px", alignItems: "flex-start" }}>
        {/* Desktop Sidebar */}
        <div className="desktop-sidebar">{renderSidebar()}</div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "12px", marginBottom: "20px",
            background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "12px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Mobile filter */}
              <button onClick={() => setMobileFilterOpen(true)}
                className="mobile-filter-btn"
                style={{ display: "none", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                <SlidersHorizontal size={14} /> Filter
              </button>
              <span style={{ fontSize: "13px", color: "#888" }}>
                <strong style={{ color: "#1a1a1a" }}>{filtered.length}</strong> Products found
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Per page */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#888" }}>
                Show:
                {[20, 30, 40, 60].map(n => (
                  <button key={n} onClick={() => { setPerPage(n); setPage(1); }}
                    style={{ padding: "3px 7px", border: "1px solid", borderColor: perPage === n ? "#f57224" : "#e5e5e5", background: perPage === n ? "#f57224" : "transparent", color: perPage === n ? "#fff" : "#555", borderRadius: "2px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                    {n}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setSortOpen(!sortOpen)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", border: "1px solid #e5e5e5", borderRadius: "3px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#555", whiteSpace: "nowrap" }}>
                  {currentSort} <ChevronDown size={13} />
                </button>
                {sortOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: "200px", marginTop: "4px" }}>
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        style={{ display: "block", width: "100%", padding: "9px 16px", background: sort === opt.value ? "#fff8f5" : "#fff", border: "none", cursor: "pointer", textAlign: "left", fontSize: "13px", color: sort === opt.value ? "#f57224" : "#555", fontWeight: sort === opt.value ? 600 : 400, borderBottom: "1px solid #f5f5f5" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid/List toggle */}
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
          {layout === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
              {paginated.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {paginated.map(product => (
                <div key={product.id} style={{ display: "flex", gap: "20px", background: "#fff", border: "1px solid #f0f0f0", borderRadius: "4px", padding: "16px", transition: "box-shadow 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
                >
                  <Link href={`/products/${product.id}`} style={{ flexShrink: 0 }}>
                    <img src={product.image} alt={product.name} style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "4px" }} />
                  </Link>
                  <div style={{ flex: 1 }}>
                    {product.badge && (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", background: product.badge === "sale" ? "#f57224" : product.badge === "new" ? "#28a745" : "#dc3545", color: "#fff", textTransform: "uppercase", display: "inline-block", marginBottom: "8px" }}>
                        {product.badge === "sale" && product.discount ? `-${product.discount}%` : product.badge}
                      </span>
                    )}
                    <Link href={`/products/${product.id}`} style={{ textDecoration: "none" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f57224")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#1a1a1a")}
                      >{product.name}</h3>
                    </Link>
                    <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                      <span style={{ fontSize: "18px", fontWeight: 700 }}>${product.price.toFixed(2)}</span>
                      {product.originalPrice && <span style={{ fontSize: "14px", color: "#aaa", textDecoration: "line-through" }}>${product.originalPrice.toFixed(2)}</span>}
                    </div>
                    <button style={{ marginTop: "14px", padding: "9px 20px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
                    >Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "36px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "8px 14px", border: "1px solid #e5e5e5", borderRadius: "3px", background: "#fff", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "#ccc" : "#555", fontSize: "13px" }}>
                ‹ Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: "36px", height: "36px", border: "1px solid", borderColor: page === p ? "#f57224" : "#e5e5e5", borderRadius: "3px", background: page === p ? "#f57224" : "#fff", color: page === p ? "#fff" : "#555", cursor: "pointer", fontSize: "13px", fontWeight: page === p ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "8px 14px", border: "1px solid #e5e5e5", borderRadius: "3px", background: "#fff", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "#ccc" : "#555", fontSize: "13px" }}>
                Next ›
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

      <style>{`
        .desktop-sidebar { display: block; }
        .mobile-filter-btn { display: none !important; }
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </ShopLayout>
  );
}
