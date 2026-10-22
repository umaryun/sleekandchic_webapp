import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store";
import type { DbOrTx } from "@/lib/services/cart";

// Everything the owner can change from the admin's Settings page, stored as
// one JSON row. Contact details stay in lib/store.ts.

const emailList = z
  .array(z.string().trim().toLowerCase().email("Enter a valid email address"))
  .max(5, "Add up to 5 addresses");

export const settingsSchema = z.object({
  /** A line across the top of every shop page. */
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(140, "Keep the announcement to 140 characters"),
    /** A page on the shop, e.g. /products?sale=1. */
    link: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")), "Use a page on the shop, starting with /"),
  }),
  notifications: z.object({
    /** Who gets emails about new orders and messages. Empty means the shop's contact email. */
    recipients: emailList,
    newOrder: z.boolean(),
    newMessage: z.boolean(),
    /** Adds sizes running low to new-order emails. */
    lowStock: z.boolean(),
  }),
  inventory: z.object({
    /** A size counts as low at this many left or fewer. */
    lowStockThreshold: z.number().int().min(0).max(100),
  }),
  /** Printed on invoices for customers who pay by transfer. */
  bank: z.object({
    bankName: z.string().trim().max(60),
    accountName: z.string().trim().max(100),
    accountNumber: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{10}$/.test(v), "Account numbers are 10 digits"),
  }),
});

export type StoreSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: { enabled: false, text: "", link: "" },
  notifications: { recipients: [], newOrder: true, newMessage: true, lowStock: true },
  inventory: { lowStockThreshold: 5 },
  bank: { bankName: "", accountName: "", accountNumber: "" },
};

const KEY = "store";

/** Saved settings over the defaults, so settings added later have a value. */
function withDefaults(saved: unknown): StoreSettings {
  const value = (saved ?? {}) as Partial<StoreSettings>;
  return {
    announcement: { ...DEFAULT_SETTINGS.announcement, ...value.announcement },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...value.notifications },
    inventory: { ...DEFAULT_SETTINGS.inventory, ...value.inventory },
    bank: { ...DEFAULT_SETTINGS.bank, ...value.bank },
  };
}

export async function getSettings(tx: DbOrTx = db): Promise<StoreSettings> {
  const [row] = await tx.select().from(storeSettings).where(eq(storeSettings.key, KEY)).limit(1);
  return withDefaults(row?.value);
}

export async function saveSettings(settings: StoreSettings, actorId: string | null) {
  await db
    .insert(storeSettings)
    .values({ key: KEY, value: settings, updatedBy: actorId })
    .onConflictDoUpdate({ target: storeSettings.key, set: { value: settings, updatedBy: actorId, updatedAt: new Date() } });
  return settings;
}

/** Who receives shop alerts: the Settings list, else OWNER_NOTIFICATION_EMAIL, else the shop's email. */
export function alertRecipients(settings: StoreSettings): string[] {
  if (settings.notifications.recipients.length > 0) return settings.notifications.recipients;
  return [env.OWNER_NOTIFICATION_EMAIL || STORE.email];
}
