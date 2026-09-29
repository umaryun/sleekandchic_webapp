/**
 * Server-Side Shipping Calculator (Database-backed with cache & fallback)
 */

import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  type ShippingMethod,
  type ShippingZone,
  type ShippingQuote,
  DEFAULT_STATE_ZONES,
  calculateShippingQuote,
  getShippingQuotesClient,
} from "./shipping-base";

// Re-export all base definitions
export * from "./shipping-base";

// ──────────────────────────────────────────────
// In-Memory Cache (TTL: 60s)
// ──────────────────────────────────────────────
let cachedRates: Record<string, ShippingZone> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000;

export function invalidateShippingCache() {
  cachedRates = null;
  cacheExpiry = 0;
}

/**
 * Fetch active shipping rates from the database with in-memory caching
 */
export async function getDbShippingRates(): Promise<Record<string, ShippingZone>> {
  const now = Date.now();
  if (cachedRates && now < cacheExpiry) {
    return cachedRates;
  }

  try {
    const rows = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.isActive, true))
      .orderBy(asc(shippingRates.state));

    if (rows && rows.length > 0) {
      const map: Record<string, ShippingZone> = {};
      for (const row of rows) {
        map[row.state] = {
          zone: row.zone,
          standardBase: row.standardBase,
          expressBase: row.expressBase,
          estimatedDays: {
            standard: row.estimatedDaysStandard,
            express: row.estimatedDaysExpress,
          },
          freeShippingThreshold: row.freeShippingThreshold,
        };
      }
      cachedRates = map;
      cacheExpiry = now + CACHE_TTL_MS;
      return map;
    }
  } catch (err) {
    console.error("Failed to load shipping rates from DB, using fallback:", err);
  }

  return DEFAULT_STATE_ZONES;
}

/**
 * Calculate shipping quote for a given state, method, subtotal, and item count
 * Uses cached rates if available or falls back to defaults.
 */
export function calculateShipping(
  state: string,
  method: ShippingMethod,
  subtotal: number,
  itemCount: number,
  customRatesMap?: Record<string, ShippingZone>
): ShippingQuote {
  const ratesMap = customRatesMap || cachedRates || DEFAULT_STATE_ZONES;
  return calculateShippingQuote(state, method, subtotal, itemCount, ratesMap);
}

/**
 * Async version of calculateShipping that guarantees fresh DB-backed rates
 */
export async function calculateShippingAsync(
  state: string,
  method: ShippingMethod,
  subtotal: number,
  itemCount: number
): Promise<ShippingQuote> {
  const ratesMap = await getDbShippingRates();
  return calculateShippingQuote(state, method, subtotal, itemCount, ratesMap);
}

/**
 * Get both standard and express quotes for a state synchronously
 */
export function getShippingQuotes(
  state: string,
  subtotal: number,
  itemCount: number,
  customRatesMap?: Record<string, ShippingZone>
): { standard: ShippingQuote; express: ShippingQuote } {
  const ratesMap = customRatesMap || cachedRates || DEFAULT_STATE_ZONES;
  return getShippingQuotesClient(state, subtotal, itemCount, ratesMap);
}

/**
 * Async version to get both quotes using database rates
 */
export async function getShippingQuotesAsync(
  state: string,
  subtotal: number,
  itemCount: number
): Promise<{ standard: ShippingQuote; express: ShippingQuote }> {
  const ratesMap = await getDbShippingRates();
  return getShippingQuotesClient(state, subtotal, itemCount, ratesMap);
}
