"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Minus, Plus, Check, MessageCircle, Link as LinkIcon } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/types";
import { formatNGN } from "@/lib/utils";
import { MAX_PER_ITEM, variantOptions, type Selection } from "@/lib/variants";
import { useCart } from "@/context/CartContext";
import ShopImage from "@/components/ShopImage";

const ACCENT = "#8a6452";
const LOW_STOCK = 3;

/**
 * The interactive part of a product page. The page itself is rendered on the
 * server (for link previews and search) and passes the product in.
 */
export default function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [selection, setSelection] = useState<Selection>(() => variantOptions(product.variants ?? []).firstAvailable());
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!product.categorySlug) return;
    let cancelled = false;
    fetchProducts({ category: product.categorySlug, limit: 5 })
      .then((rel) => {
        if (!cancelled) setRelatedProducts(rel.products.filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.categorySlug, product.id]);

  const variants = product.variants ?? [];
  const options = variantOptions(variants);
  const hasOptions = variants.length > 0;
  const variant = hasOptions ? options.find(selection) : undefined;
  const inStock = product.inStock !== false && (hasOptions ? options.anyInStock : true);

  // What stops the selection being bought, if anything.
  let blocker: string | null = null;
  if (!inStock) blocker = "Sold out";
  else if (hasOptions && options.sizes.length > 0 && !selection.size) blocker = "Choose a size";
  else if (hasOptions && options.colors.length > 0 && !selection.color) blocker = "Choose a colour";
  else if (hasOptions && !variant) blocker = "Not available in this combination";
  else if (variant && variant.stockQuantity <= 0) blocker = "Sold out in this option";

  const price = variant?.priceOverride ?? product.price;
  const maxQty = Math.min(variant ? Math.max(variant.stockQuantity, 1) : MAX_PER_ITEM, MAX_PER_ITEM);
  const quantity = Math.min(qty, maxQty);

  const productImages = product.images?.length
    ? product.images.map((img) => img.imageUrl)
    : product.image
      ? [product.image]
      : ["/placeholder-product.svg"];

  const chooseColor = (color: string) => {
    setAddError(null);
    setSelection((sel) => {
      // Keep the size if it's buyable in the new colour; otherwise ask again.
      const keepSize = sel.size && options.sizeStatus(color, sel.size) === "in_stock";
      const fallback = options.sizes.find((s) => options.sizeStatus(color, s) === "in_stock") ?? null;
      return { color, size: keepSize ? sel.size : options.sizes.length === 1 ? fallback : null };
    });
  };

  const chooseSize = (size: string) => {
    setAddError(null);
    setSelection((sel) => ({ ...sel, size }));
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

  const optionButton = (selected: boolean, unavailable: boolean) =>
    `min-w-12 rounded-[3px] border-2 px-4 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
      selected
        ? "border-[#8a6452] bg-[#8a6452] text-white"
        : unavailable
          ? "border-[#eee] bg-[#fafafa] text-[#767676] line-through"
          : "border-[#e5e5e5] bg-white text-[#555] hover:border-[#8a6452]"
    }`;

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

            {options.colors.length > 0 && (
              <fieldset className="mb-5">
                <legend className="mb-2.5 text-[13px] font-bold text-[#1a1a1a]">
                  Colour: <span className="font-semibold text-[#8a6452]">{selection.color ?? "choose one"}</span>
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {options.colors.map((color) => {
                    const soldOut = !options.colorInStock(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => chooseColor(color)}
                        aria-pressed={selection.color === color}
                        aria-label={soldOut ? `${color}, sold out` : color}
                        className={optionButton(selection.color === color, soldOut)}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {options.sizes.length > 0 && (
              <fieldset className="mb-6">
                <legend className="mb-2.5 text-[13px] font-bold text-[#1a1a1a]">
                  Size: <span className="font-semibold text-[#8a6452]">{selection.size ?? "choose one"}</span>
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {options.sizes.map((size) => {
                    const status = options.colors.length ? options.sizeStatus(selection.color, size) : options.sizeStatus(null, size);
                    const note = status === "sold_out" ? "sold out" : status === "missing" ? "not in this colour" : null;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => chooseSize(size)}
                        disabled={status !== "in_stock"}
                        aria-pressed={selection.size === size}
                        aria-label={note ? `${size}, ${note}` : size}
                        title={note ?? undefined}
                        className={`${optionButton(selection.size === size, status !== "in_stock")} disabled:cursor-not-allowed`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {variant && variant.stockQuantity > 0 && variant.stockQuantity <= LOW_STOCK && (
              <p className="mb-3 text-sm font-semibold text-[#b5651d]">Only {variant.stockQuantity} left</p>
            )}

            <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="flex shrink-0 items-center overflow-hidden rounded-[3px] border border-[#e5e5e5]">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="One fewer"
                    className="flex h-11 w-10 items-center justify-center bg-[#f5f5f5] text-neutral-600 disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-11 text-center text-sm font-bold" aria-live="polite" aria-label={`Quantity ${quantity}`}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(maxQty, quantity + 1))}
                    disabled={quantity >= maxQty}
                    aria-label="One more"
                    className="flex h-11 w-10 items-center justify-center bg-[#f5f5f5] text-neutral-600 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

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
                className="flex h-11 w-full flex-1 items-center justify-center gap-2 rounded-[3px] bg-[#8a6452] px-6 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-auto sm:text-sm"
              >
                <Zap size={16} /> Buy now
              </button>
            </div>
            {addError && (
              <p role="alert" className="mb-4 text-sm text-[#c45b5b]">
                {addError}
              </p>
            )}

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
