import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "./test-db";
import { discounts, productVariants, products, shippingRates } from "../../lib/db/schema";

export async function createProduct(input: {
  name?: string;
  price: number;
  inStock?: boolean;
  variants?: { size?: string; color?: string; stock: number; priceOverride?: number }[];
}) {
  const name = input.name ?? `Test Abaya ${crypto.randomUUID().slice(0, 6)}`;
  const [product] = await db
    .insert(products)
    .values({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      price: input.price.toFixed(2),
      inStock: input.inStock ?? true,
    })
    .returning();
  const variants = input.variants?.length
    ? await db
        .insert(productVariants)
        .values(
          input.variants.map((v) => ({
            productId: product.id,
            size: v.size ?? "M",
            color: v.color ?? "Black",
            stockQuantity: v.stock,
            priceOverride: v.priceOverride?.toFixed(2),
          }))
        )
        .returning()
    : [];
  return { product, variants };
}

export async function stockOf(variantId: string) {
  const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
  return v.stockQuantity;
}

export async function createDiscount(input: Partial<typeof discounts.$inferInsert> & { code: string }) {
  const [d] = await db
    .insert(discounts)
    .values({ discountType: "percentage", value: "10", ...input })
    .returning();
  return d;
}

/** One delivery zone so quotes are predictable: ₦1,500 standard, ₦3,500 express, free over ₦30,000. */
export async function seedKadunaRate() {
  await db.insert(shippingRates).values({
    state: "Kaduna",
    zone: "A",
    standardBase: 1500,
    expressBase: 3500,
    freeShippingThreshold: 30000,
  });
}

export function jsonRequest(url: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read loosely-shaped API bodies
export async function json<T = any>(res: Response): Promise<{ status: number; body: T }> {
  return { status: res.status, body: await res.json() };
}

export const ADDRESS = {
  firstName: "Aisha",
  lastName: "Bello",
  phone: "+2348030000000",
  street: "12 Ahmadu Bello Way",
  city: "Kaduna",
  state: "Kaduna",
  country: "Nigeria",
};

export function signPaystack(body: string) {
  return crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");
}
