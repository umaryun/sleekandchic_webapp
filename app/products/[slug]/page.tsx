"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Zap, Minus, Plus, Check, MessageCircle, Link as LinkIcon } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import { fetchProduct, fetchProducts } from "@/lib/api";
import type { Product } from "@/types";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();
  const [addError, setAddError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    fetchProduct(slug)
      .then((data) => {
        setProduct(data);

        // Extract unique colors/sizes from variants
        const colors = [...new Set(data.variants?.map((v) => v.color).filter(Boolean) as string[])];
        const sizes = [...new Set(data.variants?.map((v) => v.size).filter(Boolean) as string[])];
        if (colors.length > 0) setSelectedColor(colors[0]);
        if (sizes.length > 0) setSelectedSize(sizes[0]);

        // Fetch related products from same category
        if (data.categorySlug) {
          fetchProducts({ category: data.categorySlug, limit: 5 })
            .then((relData) => {
              const related = relData.products.filter((p) => p.id !== data.id).slice(0, 4);
              setRelatedProducts(related);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <ShopLayout>
        <PageBreadcrumb title="Loading..." crumbs={[]} />
        <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-14">
            <div>
              <div style={{ aspectRatio: "1", background: "#f5f5f5", borderRadius: "6px" }} className="animate-pulse" />
            </div>
            <div>
              <div style={{ height: "20px", background: "#f0f0f0", borderRadius: "4px", width: "40%", marginBottom: "16px" }} className="animate-pulse" />
              <div style={{ height: "32px", background: "#f0f0f0", borderRadius: "4px", width: "80%", marginBottom: "12px" }} className="animate-pulse" />
              <div style={{ height: "24px", background: "#f0f0f0", borderRadius: "4px", width: "30%", marginBottom: "24px" }} className="animate-pulse" />
              <div style={{ height: "14px", background: "#f0f0f0", borderRadius: "4px", width: "100%", marginBottom: "8px" }} className="animate-pulse" />
              <div style={{ height: "14px", background: "#f0f0f0", borderRadius: "4px", width: "90%", marginBottom: "8px" }} className="animate-pulse" />
              <div style={{ height: "14px", background: "#f0f0f0", borderRadius: "4px", width: "70%", marginBottom: "32px" }} className="animate-pulse" />
              <div style={{ height: "48px", background: "#f0f0f0", borderRadius: "4px", width: "60%" }} className="animate-pulse" />
            </div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (notFound || !product) {
    return (
      <ShopLayout>
        <div style={{ maxWidth: "1280px", margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1a1a", marginBottom: "16px" }}>Product Not Found</h1>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "32px" }}>
            Sorry, the product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: "#1a1a1a", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "14px", borderRadius: "3px" }}>
            ← Back to Products
          </Link>
        </div>
      </ShopLayout>
    );
  }

  // Extract colors/sizes from variants
  const productColors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean) as string[])];
  const productSizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean) as string[])];
  const productImages = product.images?.length
    ? product.images.map((img) => img.imageUrl)
    : product.image
      ? [product.image]
      : ["/placeholder-product.svg"];

  const addToBag = async () => {
    const matchingVariant = product.variants?.find(
      (v) =>
        (v.size || null) === (selectedSize || null) &&
        (v.color || null) === (selectedColor || null)
    );
    setAddError(null);
    setAdding(true);
    const result = await addItem(product.id, matchingVariant?.id || null, qty);
    setAdding(false);
    if (!result.ok) setAddError(result.error);
    return result.ok;
  };

  const handleAddToCart = async () => {
    if (!(await addToBag())) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = async () => {
    if (await addToBag()) router.push("/checkout");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setAddError("Couldn't copy the link. Copy it from your browser's address bar.");
    }
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title={product.name} crumbs={[{ label: "Products", href: "/products" }, ...(product.category ? [{ label: product.category, href: `/products?category=${product.categorySlug}` }] : [])]} />

      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px" }}>
        {/* Top: Gallery + Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10 md:mb-14">

          {/* Gallery */}
          <div>
            {/* Main image */}
            <div style={{ position: "relative", borderRadius: "6px", overflow: "hidden", marginBottom: "14px", background: "#fafafa", border: "1px solid #f0f0f0", aspectRatio: "1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImages[activeImg] || productImages[0]} alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }} />
            </div>
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(productImages.length, 5)}, 1fr)`, gap: "8px" }}>
                {productImages.slice(0, 9).map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ aspectRatio: "1", border: `2px solid ${activeImg === i ? "#f57224" : "#e5e5e5"}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer", padding: 0, background: "none", transition: "border-color 0.2s" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumbnail ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1a1a1a] leading-tight mb-2.5">
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: product.inStock !== false ? "#dcf5e7" : "#fde8e8", color: product.inStock !== false ? "#28a745" : "#dc3545", borderRadius: "2px", letterSpacing: "0.5px" }}>
                {product.inStock !== false ? "✓ IN STOCK" : "OUT OF STOCK"}
              </span>
              {product.badge && (
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", letterSpacing: "0.5px",
                  background: product.badge === "sale" ? "#fff3e0" : product.badge === "new" ? "#e3f2fd" : "#fce4ec",
                  color: product.badge === "sale" ? "#e65100" : product.badge === "new" ? "#1565c0" : "#c62828",
                }}>
                  {product.badge.toUpperCase()}{product.discount ? ` -${product.discount}%` : ""}
                </span>
              )}
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0" }}>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]">{formatNGN(product.price)}</span>
              {product.originalPrice && (
                <span style={{ fontSize: "18px", color: "#aaa", textDecoration: "line-through" }}>{formatNGN(product.originalPrice)}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.8, marginBottom: "24px", whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            )}

            {/* Color */}
            {productColors.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Color:</span>
                  <span style={{ fontSize: "13px", color: "#f57224", fontWeight: 600 }}>{selectedColor}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {productColors.map((color: string) => (
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
            )}

            {/* Size */}
            {productSizes.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Size:</span>
                  <span style={{ fontSize: "13px", color: "#f57224", fontWeight: 600 }}>{selectedSize}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {productSizes.map((size: string) => (
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
            )}

            {/* Qty + Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Qty */}
                <div className="flex items-center border border-[#e5e5e5] rounded-[3px] overflow-hidden shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-11 border-none bg-[#f5f5f5] cursor-pointer flex items-center justify-center text-neutral-600">
                    <Minus size={14} />
                  </button>
                  <span className="w-11 text-center text-sm font-bold">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-10 h-11 border-none bg-[#f5f5f5] cursor-pointer flex items-center justify-center text-neutral-600">
                    <Plus size={14} />
                  </button>
                </div>

                <button onClick={handleAddToCart} disabled={adding || product.inStock === false}
                  className={`flex-1 sm:w-auto px-5 h-11 sm:h-12 ${addedToCart ? "bg-[#28a745]" : "bg-[#1a1a1a]"} text-white border-none rounded-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-colors duration-200`}>
                  {addedToCart ? <><Check size={16} /> Added to Cart</> : <><ShoppingCart size={16} /> {adding ? "Adding…" : "Add To Cart"}</>}
                </button>
              </div>

              <button type="button" onClick={handleBuyNow} disabled={adding || product.inStock === false}
                className="w-full sm:w-auto flex-1 h-11 sm:h-12 px-6 bg-[#8a6452] text-white border-none rounded-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm">
                <Zap size={16} /> Buy Now
              </button>
            </div>
            {addError && (
              <p role="alert" className="text-sm text-[#c45b5b] mb-4">{addError}</p>
            )}



            {/* Meta */}
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "SKU", value: product.sku },
                { label: "Category", value: product.category },
              ].filter((row) => row.value).map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                  <span style={{ fontWeight: 700, color: "#1a1a1a", minWidth: "80px" }}>{label}:</span>
                  <span style={{ color: "#666" }}>{value}</span>
                </div>
              ))}
              {/* Share */}
              <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[13px]">
                <span className="font-bold text-[#1a1a1a]">Share:</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${product.name}: ${formatNGN(product.price)}`)}`}
                  // The page URL is only known in the browser, so it's added when tapped.
                  onClick={(e) => {
                    e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${product.name}: ${formatNGN(product.price)} ${window.location.href}`)}`;
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 font-semibold text-[#1a1a1a] no-underline hover:border-[#1a1a1a]"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 font-semibold text-[#1a1a1a] cursor-pointer hover:border-[#1a1a1a]"
                >
                  {linkCopied ? <Check size={14} /> : <LinkIcon size={14} />} {linkCopied ? "Link copied" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "24px" }}>Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
