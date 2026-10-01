"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Check, MessageCircle, Link as LinkIcon } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/types";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import ShopImage from "@/components/ShopImage";
import DeliveryInfo from "@/components/DeliveryInfo";
import { QuantityStepper, VariantPicker, useVariantSelection } from "@/components/VariantPicker";

const ACCENT = "#8a6452";
const LOW_STOCK = 3;
/** How many other pieces to suggest under the product. */
const RECOMMENDED = 8;

/**
 * The interactive part of a product page. The page itself is rendered on the
 * server (for link previews and search) and passes the product in.
 */
export default function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const picked = useVariantSelection(product);
  const { variant, inStock, blocker, price, maxQty, quantity } = picked;
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Suggestions: the same category first, topped up with the newest pieces
  // so every product page has some, and in-stock pieces before sold-out ones.
  useEffect(() => {
    let cancelled = false;
    const sameCategory = product.categorySlug
      ? fetchProducts({ category: product.categorySlug, limit: RECOMMENDED + 1 }).then((r) => r.products)
      : Promise.resolve([]);
    const newest = fetchProducts({ sort: "newest", limit: RECOMMENDED * 2 }).then((r) => r.products);
    Promise.all([sameCategory.catch(() => []), newest.catch(() => [])]).then(([same, more]) => {
      if (cancelled) return;
      const seen = new Set([product.id]);
      const unique = [...same, ...more].filter((p) => !seen.has(p.id) && Boolean(seen.add(p.id)));
      const ordered = [...unique.filter((p) => !p.soldOut), ...unique.filter((p) => p.soldOut)];
      setRelatedProducts(ordered.slice(0, RECOMMENDED));
    });
    return () => {
      cancelled = true;
    };
  }, [product.categorySlug, product.id]);

  const productImages = product.images?.length
    ? product.images.map((img) => img.imageUrl)
    : product.image
      ? [product.image]
      : ["/placeholder-product.svg"];

  const chooseColor = (color: string) => {
    setAddError(null);
    picked.chooseColor(color);
  };

  const chooseSize = (size: string) => {
    setAddError(null);
    picked.chooseSize(size);
  };

  const addToBag = async () => {
    if (blocker) {
      setAddError(blocker);
      return false;
    }
    setAddError(null);
    setAdding(true);
    const result = await addItem(product.id, variant?.id ?? null, quantity);
    setAdding(false);
    if (!result.ok) setAddError(result.error);
    return result.ok;
  };

  const handleAddToCart = async () => {
    if (!(await addToBag())) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Checks out just this item; the bag is left as it is.
  const handleBuyNow = () => {
    if (blocker) {
      setAddError(blocker);
      return;
    }
    const params = new URLSearchParams({ buy: product.id, qty: String(quantity) });
    if (variant) params.set("variant", variant.id);
    router.push(`/checkout?${params}`);
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
      <PageBreadcrumb
        title={product.name}
        crumbs={[
          { label: "Products", href: "/products" },
          ...(product.category ? [{ label: product.category, href: `/products?category=${product.categorySlug}` }] : []),
        ]}
      />

      <div className="mx-auto my-9 max-w-[1280px] px-4">
        <div className="mb-10 grid grid-cols-1 gap-6 md:mb-14 md:grid-cols-2 md:gap-12">
          {/* Gallery */}
          <div>
            <div className="relative mb-3.5 aspect-square overflow-hidden rounded-md border border-[#f0f0f0] bg-[#fafafa]">
              <ShopImage
                src={productImages[activeImg] || productImages[0]}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            {productImages.length > 1 && (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(productImages.length, 5)}, 1fr)` }}>
                {productImages.slice(0, 9).map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={activeImg === i}
                    className="aspect-square overflow-hidden rounded border-2 p-0 transition-colors"
                    style={{ borderColor: activeImg === i ? ACCENT : "#e5e5e5" }}
                  >
                    <span className="relative block h-full w-full">
                      <ShopImage src={img} alt="" fill sizes="120px" className="object-cover" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="mb-2.5 text-xl font-extrabold leading-tight text-[#1a1a1a] sm:text-2xl lg:text-3xl">{product.name}</h1>

            <div className="mb-4 flex items-center gap-1.5">
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                  inStock ? "bg-[#dcf5e7] text-[#1e7b3a]" : "bg-[#fde8e8] text-[#b02a37]"
                }`}
              >
                {inStock ? "IN STOCK" : "SOLD OUT"}
              </span>
              {product.badge && (
                <span className="rounded-sm bg-[#f6efe9] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#8a6452]">
                  {product.badge.toUpperCase()}
                  {product.discount ? ` -${product.discount}%` : ""}
                </span>
              )}
            </div>

            <div className="mb-5 flex items-baseline gap-3 border-b border-[#f0f0f0] pb-5">
              <span className="text-2xl font-extrabold text-[#1a1a1a] sm:text-3xl">{formatNGN(price)}</span>
              {product.originalPrice && !variant?.priceOverride && (
                <span className="text-lg text-[#767676] line-through">{formatNGN(product.originalPrice)}</span>
              )}
            </div>

            {product.description && (
              <p className="mb-6 whitespace-pre-line text-sm leading-[1.8] text-[#666]">{product.description}</p>
            )}

            <VariantPicker selection={picked} onColor={chooseColor} onSize={chooseSize} />

            {variant && variant.stockQuantity > 0 && variant.stockQuantity <= LOW_STOCK && (
              <p className="mb-3 text-sm font-semibold text-[#b5651d]">Only {variant.stockQuantity} left</p>
            )}

            <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <QuantityStepper quantity={quantity} max={maxQty} onChange={picked.setQuantity} />

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding || !!blocker}
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-[3px] px-5 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-auto sm:text-sm ${
                    addedToCart ? "bg-[#28a745]" : "bg-[#1a1a1a]"
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check size={16} /> Added to bag
                    </>
                  ) : blocker ? (
                    blocker
                  ) : (
                    <>
                      <ShoppingCart size={16} /> {adding ? "Adding…" : "Add to bag"}
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={adding || !!blocker}
                // flex-1 only in the row layout: in the stacked phone layout it
                // overrides h-11 and squashes the button to its text height.
                className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[3px] bg-[#8a6452] px-6 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-auto sm:flex-1 sm:text-sm"
              >
                <Zap size={16} /> Buy now
              </button>
            </div>
            {addError && (
              <p role="alert" className="mb-4 text-sm text-[#c45b5b]">
                {addError}
              </p>
            )}

            <DeliveryInfo />

            <div className="flex flex-col gap-2 border-t border-[#f0f0f0] pt-4">
              {[
                { label: "SKU", value: product.sku },
                { label: "Category", value: product.category },
              ]
                .filter((row) => row.value)
                .map(({ label, value }) => (
                  <div key={label} className="flex gap-2 text-[13px]">
                    <span className="min-w-20 font-bold text-[#1a1a1a]">{label}:</span>
                    <span className="text-[#666]">{value}</span>
                  </div>
                ))}
              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[13px]">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 font-semibold text-[#1a1a1a] hover:border-[#1a1a1a]"
                >
                  {linkCopied ? <Check size={14} /> : <LinkIcon size={14} />} {linkCopied ? "Link copied" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="mb-6 text-[22px] font-bold text-[#1a1a1a]">You may also like</h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopLayout>
  );
}
