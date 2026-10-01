"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/types";
import { MAX_PER_ITEM, variantOptions, type Selection } from "@/lib/variants";

/**
 * The size, colour and quantity a shopper has picked for a product, and what
 * (if anything) stops that choice being bought. Shared by the product page and
 * the quick-add window so both follow the same rules.
 */
export function useVariantSelection(product: Product) {
  const variants = product.variants ?? [];
  const options = variantOptions(variants);
  const [selection, setSelection] = useState<Selection>(() => variantOptions(product.variants ?? []).firstAvailable());
  const [qty, setQty] = useState(1);

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

  const maxQty = Math.min(variant ? Math.max(variant.stockQuantity, 1) : MAX_PER_ITEM, MAX_PER_ITEM);

  const chooseColor = (color: string) =>
    setSelection((sel) => {
      // Keep the size if it's buyable in the new colour; otherwise ask again.
      const keepSize = sel.size && options.sizeStatus(color, sel.size) === "in_stock";
      const fallback = options.sizes.find((s) => options.sizeStatus(color, s) === "in_stock") ?? null;
      return { color, size: keepSize ? sel.size : options.sizes.length === 1 ? fallback : null };
    });

  const chooseSize = (size: string) => setSelection((sel) => ({ ...sel, size }));

  return {
    options,
    selection,
    chooseColor,
    chooseSize,
    variant,
    inStock,
    blocker,
    price: variant?.priceOverride ?? product.price,
    maxQty,
    quantity: Math.min(qty, maxQty),
    setQuantity: setQty,
  };
}

export type VariantSelection = ReturnType<typeof useVariantSelection>;

const optionButton = (selected: boolean, unavailable: boolean) =>
  `min-w-12 rounded-[3px] border-2 px-4 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
    selected
      ? "border-[#8a6452] bg-[#8a6452] text-white"
      : unavailable
        ? "border-[#eee] bg-[#fafafa] text-[#767676] line-through"
        : "border-[#e5e5e5] bg-white text-[#555] hover:border-[#8a6452]"
  }`;

/** Colour and size buttons. Sold-out and missing combinations are shown but can't be picked. */
export function VariantPicker({
  selection,
  onColor,
  onSize,
}: {
  selection: VariantSelection;
  onColor?: (color: string) => void;
  onSize?: (size: string) => void;
}) {
  const { options, selection: chosen } = selection;
  const pickColor = onColor ?? selection.chooseColor;
  const pickSize = onSize ?? selection.chooseSize;

  return (
    <>
      {options.colors.length > 0 && (
        <fieldset className="mb-5">
          <legend className="mb-2.5 text-[13px] font-bold text-[#1a1a1a]">
            Colour: <span className="font-semibold text-[#8a6452]">{chosen.color ?? "choose one"}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {options.colors.map((color) => {
              const soldOut = !options.colorInStock(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => pickColor(color)}
                  aria-pressed={chosen.color === color}
                  aria-label={soldOut ? `${color}, sold out` : color}
                  className={optionButton(chosen.color === color, soldOut)}
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
            Size: <span className="font-semibold text-[#8a6452]">{chosen.size ?? "choose one"}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {options.sizes.map((size) => {
              const status = options.colors.length ? options.sizeStatus(chosen.color, size) : options.sizeStatus(null, size);
              const note = status === "sold_out" ? "sold out" : status === "missing" ? "not in this colour" : null;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => pickSize(size)}
                  disabled={status !== "in_stock"}
                  aria-pressed={chosen.size === size}
                  aria-label={note ? `${size}, ${note}` : size}
                  title={note ?? undefined}
                  className={`${optionButton(chosen.size === size, status !== "in_stock")} disabled:cursor-not-allowed`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}

/** − / + quantity control, kept within 1 and `max`. */
export function QuantityStepper({ quantity, max, onChange }: { quantity: number; max: number; onChange: (qty: number) => void }) {
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-[3px] border border-[#e5e5e5]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
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
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="One more"
        className="flex h-11 w-10 items-center justify-center bg-[#f5f5f5] text-neutral-600 disabled:opacity-40"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
