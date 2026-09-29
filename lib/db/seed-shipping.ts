import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "./index";
import { shippingRates } from "./schema";
import { eq } from "drizzle-orm";

export const INITIAL_SHIPPING_RATES = [
  // Zone A — Warehouse region (Kaduna & nearby northern states)
  { state: "Kaduna", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Same day / Next day", freeShippingThreshold: 30000 },
  { state: "Kano", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Same day / Next day", freeShippingThreshold: 30000 },
  { state: "Katsina", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Next day", freeShippingThreshold: 30000 },
  { state: "Niger", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Next day", freeShippingThreshold: 30000 },
  { state: "Plateau", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Next day", freeShippingThreshold: 30000 },
  { state: "Nassarawa", zone: "A", standardBase: 1500, expressBase: 3500, estimatedDaysStandard: "1–2 days", estimatedDaysExpress: "Next day", freeShippingThreshold: 30000 },

  // Zone B — Abuja + other northern states
  { state: "Abuja (FCT)", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Bauchi", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Jigawa", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Kwara", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Kogi", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Zamfara", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Kebbi", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Sokoto", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Nasarawa", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Gombe", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },
  { state: "Benue", zone: "B", standardBase: 2500, expressBase: 5000, estimatedDaysStandard: "2–3 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 50000 },

  // Zone C — Southwest
  { state: "Lagos", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "1–2 days", freeShippingThreshold: 75000 },
  { state: "Ogun", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },
  { state: "Oyo", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },
  { state: "Osun", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },
  { state: "Ondo", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },
  { state: "Ekiti", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },
  { state: "Edo", zone: "C", standardBase: 3000, expressBase: 6000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 75000 },

  // Zone D — Southeast + South-South
  { state: "Delta", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Rivers", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Anambra", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Enugu", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Imo", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Abia", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Ebonyi", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Akwa Ibom", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Cross River", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "3–5 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Bayelsa", zone: "D", standardBase: 3500, expressBase: 7000, estimatedDaysStandard: "4–6 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },

  // Zone E — Far north / remote
  { state: "Adamawa", zone: "E", standardBase: 4000, expressBase: 8000, estimatedDaysStandard: "4–6 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Taraba", zone: "E", standardBase: 4000, expressBase: 8000, estimatedDaysStandard: "4–6 days", estimatedDaysExpress: "2–3 days", freeShippingThreshold: 100000 },
  { state: "Borno", zone: "E", standardBase: 4000, expressBase: 8000, estimatedDaysStandard: "5–7 days", estimatedDaysExpress: "3–4 days", freeShippingThreshold: 100000 },
  { state: "Yobe", zone: "E", standardBase: 4000, expressBase: 8000, estimatedDaysStandard: "5–7 days", estimatedDaysExpress: "3–4 days", freeShippingThreshold: 100000 },
];

export async function seedShippingRates() {
  console.log("Checking and seeding shipping rates...");
  let inserted = 0;
  let skipped = 0;

  for (const rate of INITIAL_SHIPPING_RATES) {
    const [existing] = await db
      .select({ id: shippingRates.id })
      .from(shippingRates)
      .where(eq(shippingRates.state, rate.state))
      .limit(1);

    if (existing) {
      skipped++;
    } else {
      await db.insert(shippingRates).values({
        state: rate.state,
        zone: rate.zone,
        standardBase: rate.standardBase,
        expressBase: rate.expressBase,
        estimatedDaysStandard: rate.estimatedDaysStandard,
        estimatedDaysExpress: rate.estimatedDaysExpress,
        freeShippingThreshold: rate.freeShippingThreshold,
        isActive: true,
      });
      inserted++;
    }
  }

  console.log(`Shipping rates seed completed: ${inserted} inserted, ${skipped} already existed.`);
  return { inserted, skipped };
}

if (require.main === module || process.argv[1]?.endsWith("seed-shipping.ts")) {
  seedShippingRates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Shipping seed failed:", err);
      process.exit(1);
    });
}
