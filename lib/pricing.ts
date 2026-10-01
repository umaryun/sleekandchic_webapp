/**
 * Sale details come from the prices alone: a product is on sale when its
 * "was" price (originalPrice) is above its price. The percentage and the
 * Sale badge are worked out from that, so they can't contradict each other.
 */
export function saleInfo(price: number, originalPrice: number | null | undefined) {
  const onSale = originalPrice != null && originalPrice > price;
  return {
    onSale,
    originalPrice: onSale ? originalPrice : null,
    discountPercent: onSale ? Math.floor(((originalPrice - price) / originalPrice) * 100) : null,
  };
}

/** The badge to show: "sale" from the prices; otherwise the chosen "new"/"hot". */
export function displayBadge(onSale: boolean, badge: string | null): "sale" | "new" | "hot" | null {
  if (onSale) return "sale";
  return badge === "new" || badge === "hot" ? badge : null;
}
