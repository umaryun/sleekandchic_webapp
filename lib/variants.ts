import type { ProductVariant } from "@/types";

/** Most a shopper can put in the bag of one item (matches the cart API). */
export const MAX_PER_ITEM = 20;

export interface Selection {
  color: string | null;
  size: string | null;
}

/**
 * What can be bought: which colours and sizes exist, which combinations are
 * in stock, and the variant a selection points to.
 */
export function variantOptions(variants: ProductVariant[]) {
  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];
  const sizes = [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))];

  const find = (sel: Selection) =>
    variants.find((v) => (v.color || null) === (colors.length ? sel.color : null) && (v.size || null) === (sizes.length ? sel.size : null));

  return {
    colors,
    sizes,
    find,
    /** Whether any size of this colour is in stock. */
    colorInStock: (color: string) => variants.some((v) => v.color === color && v.stockQuantity > 0),
    /** "in_stock", "sold_out", or "missing" when this size doesn't come in the chosen colour. */
    sizeStatus: (color: string | null, size: string): "in_stock" | "sold_out" | "missing" => {
      const v = find({ color, size });
      if (!v) return "missing";
      return v.stockQuantity > 0 ? "in_stock" : "sold_out";
    },
    anyInStock: variants.some((v) => v.stockQuantity > 0),
    /** The first in-stock combination, so the page opens on something buyable. */
    firstAvailable: (): Selection => {
      const v = variants.find((x) => x.stockQuantity > 0) ?? variants[0];
      return { color: v?.color || null, size: v?.size || null };
    },
  };
}
