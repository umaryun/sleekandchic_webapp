// Money is stored as decimal(12,2) naira. Arithmetic is done in whole kobo so
// totals never pick up floating-point pennies (and match Paystack, which bills in kobo).

export function toKobo(naira: string | number | null | undefined): number {
  return Math.round(Number(naira ?? 0) * 100);
}

/** Kobo → decimal string for a decimal(12,2) column. */
export function koboToDecimal(kobo: number): string {
  return (kobo / 100).toFixed(2);
}

/** Kobo → naira number for API responses. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
