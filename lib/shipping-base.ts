/**
 * Base Shipping Types, Constants & Client-Safe Calculations
 * Safe to import in both Client ("use client") and Server components.
 */

export type ShippingMethod = "standard" | "express";

export interface ShippingZone {
  zone: string;
  standardBase: number;
  expressBase: number;
  estimatedDays: { standard: string; express: string };
  freeShippingThreshold?: number;
}

export interface ShippingQuote {
  /** False when there's no rate for the state; the order can't be placed. */
  deliverable: boolean;
  method: ShippingMethod;
  fee: number;
  estimatedDays: string;
  zone: string;
  zoneName: string;
  freeThreshold: number;
  isFree: boolean;
}

export interface ShippingRateItem {
  id?: string;
  state: string;
  zone: string;
  zoneName: string;
  standardBase: number;
  expressBase: number;
  estimatedDays: { standard: string; express: string };
  freeShippingThreshold?: number;
  isActive?: boolean;
}

// Fallback baseline state-to-zone mapping (warehouse assumed in Kaduna)
export const DEFAULT_STATE_ZONES: Record<string, ShippingZone> = {
  // Zone A — Warehouse region (Kaduna & immediate neighbours)
  Kaduna:    { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Same day / Next day" }, freeShippingThreshold: 30000 },
  Kano:      { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Same day / Next day" }, freeShippingThreshold: 30000 },
  Katsina:   { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" }, freeShippingThreshold: 30000 },
  Niger:     { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" }, freeShippingThreshold: 30000 },
  Plateau:   { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" }, freeShippingThreshold: 30000 },

  // Zone B — Abuja + other northern states
  "Abuja (FCT)": { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Bauchi:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Jigawa:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Kwara:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Kogi:      { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Zamfara:   { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Kebbi:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Sokoto:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Nasarawa:  { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Gombe:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },
  Benue:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" }, freeShippingThreshold: 50000 },

  // Zone C — Southwest
  Lagos:     { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "1–2 days" }, freeShippingThreshold: 75000 },
  Ogun:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },
  Oyo:       { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },
  Osun:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },
  Ondo:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },
  Ekiti:     { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },
  Edo:       { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 75000 },

  // Zone D — Southeast + South-South
  Delta:       { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Rivers:      { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Anambra:     { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Enugu:       { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Imo:         { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Abia:        { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Ebonyi:      { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  "Akwa Ibom": { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  "Cross River":{ zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Bayelsa:     { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "4–6 days", express: "2–3 days" }, freeShippingThreshold: 100000 },

  // Zone E — Far north / remote
  Adamawa:   { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "4–6 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Taraba:    { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "4–6 days", express: "2–3 days" }, freeShippingThreshold: 100000 },
  Borno:     { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "5–7 days", express: "3–4 days" }, freeShippingThreshold: 100000 },
  Yobe:      { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "5–7 days", express: "3–4 days" }, freeShippingThreshold: 100000 },
};

export const DEFAULT_FREE_SHIPPING_THRESHOLDS: Record<string, number> = {
  A: 30000,
  B: 50000,
  C: 75000,
  D: 100000,
  E: 100000,
};

export const ZONE_NAMES: Record<string, string> = {
  A: "Local (Kaduna & Nearby)",
  B: "Northern Nigeria",
  C: "Southwest Nigeria",
  D: "Southeast / South-South",
  E: "Far North / Remote",
};

/** Orders of more than this many items pay a little extra delivery per item. */
export const BULK_ITEMS_INCLUDED = 3;
export const BULK_ITEM_SURCHARGE = 200;

/**
 * The rate for a state: the configured one, else the built-in default for that
 * state. Null when neither exists; such a state is never priced as another.
 */
export function matchZoneInfo(
  state: string,
  ratesMap: Record<string, ShippingZone> = DEFAULT_STATE_ZONES
): ShippingZone | null {
  const lower = state.trim().toLowerCase();
  if (!lower) return null;
  for (const map of [ratesMap, DEFAULT_STATE_ZONES]) {
    const key = Object.keys(map).find((k) => k.toLowerCase() === lower);
    if (key) return map[key];
  }
  return null;
}

/**
 * Calculate shipping quote (client-safe)
 */
export function calculateShippingQuote(
  state: string,
  method: ShippingMethod,
  subtotal: number,
  itemCount: number,
  ratesMap: Record<string, ShippingZone> = DEFAULT_STATE_ZONES
): ShippingQuote {
  const zoneInfo = matchZoneInfo(state, ratesMap);
  if (!zoneInfo) {
    return { deliverable: false, method, fee: 0, estimatedDays: "", zone: "", zoneName: "", freeThreshold: 0, isFree: false };
  }
  const { zone, standardBase, expressBase, estimatedDays } = zoneInfo;

  const freeThreshold =
    zoneInfo.freeShippingThreshold ??
    DEFAULT_FREE_SHIPPING_THRESHOLDS[zone] ??
    50000;

  let baseFee = method === "express" ? expressBase : standardBase;

  if (itemCount > BULK_ITEMS_INCLUDED) {
    baseFee += (itemCount - BULK_ITEMS_INCLUDED) * BULK_ITEM_SURCHARGE;
  }

  const isFreeEligible = method === "standard" && subtotal >= freeThreshold;

  return {
    deliverable: true,
    method,
    fee: isFreeEligible ? 0 : baseFee,
    estimatedDays: estimatedDays[method],
    zone,
    zoneName: ZONE_NAMES[zone] || `Zone ${zone}`,
    freeThreshold,
    isFree: isFreeEligible,
  };
}

/**
 * Calculate both standard and express quotes
 */
export function getShippingQuotesClient(
  state: string,
  subtotal: number,
  itemCount: number,
  ratesMap: Record<string, ShippingZone> = DEFAULT_STATE_ZONES
): { standard: ShippingQuote; express: ShippingQuote } {
  return {
    standard: calculateShippingQuote(state, "standard", subtotal, itemCount, ratesMap),
    express: calculateShippingQuote(state, "express", subtotal, itemCount, ratesMap),
  };
}
