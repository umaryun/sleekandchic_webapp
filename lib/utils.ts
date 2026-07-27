/**
 * Format amount in Nigerian Naira (NGN)
 * Example: 150000 -> ₦150,000.00
 */
export function formatNGN(amount: number | string | null | undefined): string {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
