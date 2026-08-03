/**
 * Dynamic Shipping Calculator for Nigeria
 *
 * Shipping is calculated based on:
 * 1. Destination state (zone-based pricing)
 * 2. Shipping method (standard vs express)
 * 3. Cart subtotal (free standard shipping thresholds)
 * 4. Total item count / weight factor
 *
 * Zone definitions:
 * - Zone A (₦1,500 std / ₦3,500 exp): Kaduna & nearby northern states (warehouse region)
 * - Zone B (₦2,500 std / ₦5,000 exp): Other northern states + Abuja
 * - Zone C (₦3,000 std / ₦6,000 exp): Southwest (Lagos, Ogun, Oyo, etc.)
 * - Zone D (₦3,500 std / ₦7,000 exp): Southeast / South-South
 * - Zone E (₦4,000 std / ₦8,000 exp): Far north / remote states
 */

export type ShippingMethod = "standard" | "express";

interface ShippingZone {
  zone: "A" | "B" | "C" | "D" | "E";
  standardBase: number;
  expressBase: number;
  estimatedDays: { standard: string; express: string };
}

// State-to-zone mapping (warehouse assumed in Kaduna)
const STATE_ZONES: Record<string, ShippingZone> = {
  // Zone A — Warehouse region (Kaduna & immediate neighbours)
  Kaduna:    { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Same day / Next day" } },
  Kano:      { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Same day / Next day" } },
  Katsina:   { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" } },
  Niger:     { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" } },
  Plateau:   { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" } },
  Nassarawa: { zone: "A", standardBase: 1500, expressBase: 3500, estimatedDays: { standard: "1–2 days", express: "Next day" } },

  // Zone B — Abuja + other northern states
  "Abuja (FCT)": { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Bauchi:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Jigawa:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Kwara:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Kogi:      { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Zamfara:   { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Kebbi:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Sokoto:    { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Nasarawa:  { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Gombe:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },
  Benue:     { zone: "B", standardBase: 2500, expressBase: 5000, estimatedDays: { standard: "2–3 days", express: "1–2 days" } },

  // Zone C — Southwest
  Lagos:     { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "1–2 days" } },
  Ogun:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Oyo:       { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Osun:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Ondo:      { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Ekiti:     { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Edo:       { zone: "C", standardBase: 3000, expressBase: 6000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },

  // Zone D — Southeast + South-South
  Delta:       { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Rivers:      { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Anambra:     { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Enugu:       { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Imo:         { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Abia:        { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Ebonyi:      { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  "Akwa Ibom": { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  "Cross River":{ zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "3–5 days", express: "2–3 days" } },
  Bayelsa:     { zone: "D", standardBase: 3500, expressBase: 7000, estimatedDays: { standard: "4–6 days", express: "2–3 days" } },

  // Zone E — Far north / remote
  Adamawa:   { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "4–6 days", express: "2–3 days" } },
  Taraba:    { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "4–6 days", express: "2–3 days" } },
  Borno:     { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "5–7 days", express: "3–4 days" } },
  Yobe:      { zone: "E", standardBase: 4000, expressBase: 8000, estimatedDays: { standard: "5–7 days", express: "3–4 days" } },
};

// Free standard shipping threshold per zone
const FREE_SHIPPING_THRESHOLDS: Record<string, number> = {
  A: 30000,  // Free standard in Zone A over ₦30k
  B: 50000,  // Free standard in Zone B over ₦50k
  C: 75000,  // Free standard in Zone C over ₦75k
  D: 100000, // Free standard in Zone D over ₦100k
  E: 100000, // Free standard in Zone E over ₦100k (no free for express)
};

export interface ShippingQuote {
  method: ShippingMethod;
  fee: number;
  estimatedDays: string;
  zone: string;
  zoneName: string;
  freeThreshold: number;
  isFree: boolean;
}

function getZoneInfo(state: string): ShippingZone {
  // Try exact match first
  if (STATE_ZONES[state]) return STATE_ZONES[state];

  // Try case-insensitive partial match
  const key = Object.keys(STATE_ZONES).find(
    (k) => k.toLowerCase() === state.toLowerCase()
  );
  if (key) return STATE_ZONES[key];

  // Default fallback — Zone C pricing
  return {
    zone: "C",
    standardBase: 3000,
    expressBase: 6000,
    estimatedDays: { standard: "3–5 days", express: "2–3 days" },
  };
}

const ZONE_NAMES: Record<string, string> = {
  A: "Local (Kaduna & Nearby)",
  B: "Northern Nigeria",
  C: "Southwest Nigeria",
  D: "Southeast / South-South",
  E: "Far North / Remote",
};

/**
 * Calculate shipping for a given state, method, subtotal, and item count
 */
export function calculateShipping(
  state: string,
  method: ShippingMethod,
  subtotal: number,
  itemCount: number
): ShippingQuote {
  const zoneInfo = getZoneInfo(state);
  const { zone, standardBase, expressBase, estimatedDays } = zoneInfo;

  const freeThreshold = FREE_SHIPPING_THRESHOLDS[zone] ?? 50000;

  let baseFee = method === "express" ? expressBase : standardBase;

  // Apply per-item surcharge for bulk orders (over 3 items: +₦200 per extra item)
  if (itemCount > 3) {
    baseFee += (itemCount - 3) * 200;
  }

  // Check free standard shipping eligibility
  const isFreeEligible = method === "standard" && subtotal >= freeThreshold;

  return {
    method,
    fee: isFreeEligible ? 0 : baseFee,
    estimatedDays: estimatedDays[method],
    zone,
    zoneName: ZONE_NAMES[zone] || "Nigeria",
    freeThreshold,
    isFree: isFreeEligible,
  };
}

/**
 * Get both standard and express quotes for a state
 */
export function getShippingQuotes(
  state: string,
  subtotal: number,
  itemCount: number
): { standard: ShippingQuote; express: ShippingQuote } {
  return {
    standard: calculateShipping(state, "standard", subtotal, itemCount),
    express: calculateShipping(state, "express", subtotal, itemCount),
  };
}
