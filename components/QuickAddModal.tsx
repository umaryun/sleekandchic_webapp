"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Loader2, ShoppingCart, X } from "lucide-react";
import type { Product } from "@/types";
import { fetchProduct } from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useDialog } from "@/lib/hooks/use-dialog";
import ShopImage from "@/components/ShopImage";
import { QuantityStepper, VariantPicker, useVariantSelection } from "@/components/VariantPicker";

const LOW_STOCK = 3;

type Load = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; product: Product };

/**
 * Pick a size, colour and quantity and add to the bag without leaving the
 * page. A bottom sheet on phones, a centred window on larger screens.
 */
export default function QuickAddModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  useDialog(true, onClose, panelRef);

  // The listing doesn't carry sizes and stock; the product endpoint does.
  useEffect(() => {
    let cancelled = false;
    fetchProduct(product.slug)
      .then((full) => !cancelled && setLoad({ kind: "ready", product: full }))
      .catch(() => !cancelled && setLoad({ kind: "error", message: "We couldn't load the sizes for this item." }));
    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  // Keep the page behind from scrolling while the window is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45 animate-[fadeIn_200ms_ease]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.18)] animate-[sheetIn_240ms_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[440px] sm:rounded-lg sm:pb-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
        >
          <X size={18} />
        </button>

        {load.kind === "ready" ? (
          <QuickAddForm product={load.product} onClose={onClose} />
        ) : (
          <>
            <Summary product={product} price={product.price} />
            {load.kind === "loading" ? (
              <div className="flex justify-center py-10 text-[#6b6b6b]">
                <Loader2 className="animate-spin" size={24} aria-label="Loading sizes" />
              </div>
            ) : (
              <div className="py-4">
                <p role="alert" className="mb-4 text-sm text-[#c45b5b]">
                  {load.message}
                </p>
                <Link
                  href={`/products/${product.slug}`}
                  className="flex h-11 items-center justify-center rounded-[3px] bg-[#1a1a1a] text-sm font-bold text-white no-underline"
                >
                  View the product
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function Summary({ product, price }: { product: Product; price: number }) {
  return (
    <div className="mb-5 flex items-center gap-3.5 pr-9">
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded border border-[#f0f0f0] bg-[#faf9f8]">
        <ShopImage src={product.image || "/placeholder-product.svg"} alt="" fill sizes="72px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <h2 id="quick-add-title" className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#1a1a1a]">
          {product.name}
        </h2>
        <p className="mt-1 text-[17px] font-bold text-[#8a6452]">{formatNGN(price)}</p>
      </div>
    </div>
  );
}

function QuickAddForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart();
  const picked = useVariantSelection(product);
  const { variant, blocker, price, maxQty, quantity } = picked;
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const add = async () => {
    if (blocker) {
      setError(blocker);
      return;
    }
    setError(null);
    setAdding(true);
    const result = await addItem(product.id, variant?.id ?? null, quantity);
    setAdding(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const option = [variant?.color, variant?.size].filter(Boolean).join(", ");
    setAdded(`${quantity} × ${product.name}${option ? ` (${option})` : ""}`);
  };

  if (added) {
    return (
      <div className="pt-2 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#dcf5e7]">
          <Check size={24} className="text-[#1e7b3a]" />
        </div>
        <h2 id="quick-add-title" className="mb-1 text-lg font-extrabold text-[#1a1a1a]">
          Added to your bag
        </h2>
        <p className="mb-5 text-sm text-[#666]">{added}</p>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/cart"
            className="flex h-11 items-center justify-center rounded-[3px] bg-[#1a1a1a] text-sm font-bold text-white no-underline"
          >
            View bag &amp; check out
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-[3px] border-2 border-[#1a1a1a] text-sm font-bold text-[#1a1a1a]"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Summary product={product} price={price} />

      <VariantPicker
        selection={picked}
        onColor={(c) => {
          setError(null);
          picked.chooseColor(c);
        }}
        onSize={(s) => {
          setError(null);
          picked.chooseSize(s);
        }}
      />

      {variant && variant.stockQuantity > 0 && variant.stockQuantity <= LOW_STOCK && (
        <p className="mb-3 text-sm font-semibold text-[#b5651d]">Only {variant.stockQuantity} left</p>
      )}

      <p className="mb-2.5 text-[13px] font-bold text-[#1a1a1a]">Quantity</p>
      <div className="flex items-center gap-3">
        <QuantityStepper quantity={quantity} max={maxQty} onChange={picked.setQuantity} />
        <button
          type="button"
          onClick={add}
          disabled={adding || !!blocker}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[3px] bg-[#1a1a1a] px-4 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {blocker ?? (
            <>
              <ShoppingCart size={16} /> {adding ? "Adding…" : "Add to cart"}
            </>
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#c45b5b]">
          {error}
        </p>
      )}

      <Link
        href={`/products/${product.slug}`}
        className="mt-4 block text-center text-[13px] font-semibold text-[#8a6452] underline-offset-2 hover:underline"
      >
        View full details
      </Link>
    </>
  );
}
