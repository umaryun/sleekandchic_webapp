import { describe, expect, it } from "vitest";
import { variantOptions } from "@/lib/variants";

const v = (id: string, color: string | null, size: string | null, stock: number, priceOverride: number | null = null) => ({
  id,
  color,
  size,
  stockQuantity: stock,
  priceOverride,
});

describe("product options", () => {
  const options = variantOptions([
    v("1", "Black", "M", 0),
    v("2", "Black", "L", 2, 26000),
    v("3", "Emerald", "M", 4),
  ]);

  it("opens on something that can be bought", () => {
    expect(options.firstAvailable()).toEqual({ color: "Black", size: "L" });
  });

  it("tells sold-out sizes apart from sizes a colour doesn't come in", () => {
    expect(options.sizeStatus("Black", "M")).toBe("sold_out");
    expect(options.sizeStatus("Black", "L")).toBe("in_stock");
    expect(options.sizeStatus("Emerald", "L")).toBe("missing");
  });

  it("finds the variant (and its price) for a selection", () => {
    expect(options.find({ color: "Black", size: "L" })?.priceOverride).toBe(26000);
    expect(options.find({ color: "Emerald", size: "L" })).toBeUndefined();
  });

  it("handles products with sizes only", () => {
    const sizesOnly = variantOptions([v("a", null, "S", 0), v("b", null, "M", 1)]);
    expect(sizesOnly.colors).toEqual([]);
    expect(sizesOnly.firstAvailable()).toEqual({ color: null, size: "M" });
    expect(sizesOnly.sizeStatus(null, "S")).toBe("sold_out");
    expect(sizesOnly.find({ color: "anything", size: "M" })?.id).toBe("b");
  });

  it("knows when nothing is left", () => {
    expect(variantOptions([v("x", "Black", "M", 0)]).anyInStock).toBe(false);
  });
});
