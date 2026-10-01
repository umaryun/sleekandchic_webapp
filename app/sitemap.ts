import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { siteUrl } from "@/lib/env";

// Built per request from the live catalogue, so new and archived products
// show up straight away (and the build doesn't need the database).
export const dynamic = "force-dynamic";

const STATIC_PAGES = ["", "/products", "/about", "/contact", "/help", "/returns", "/privacy", "/terms", "/orders/tracking"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productRows, categoryRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "active")),
    db.select({ slug: categories.slug }).from(categories),
  ]);

  return [
    ...STATIC_PAGES.map((path) => ({ url: `${siteUrl}${path}` })),
    ...categoryRows.map((c) => ({ url: `${siteUrl}/products?category=${encodeURIComponent(c.slug)}` })),
    ...productRows.map((p) => ({ url: `${siteUrl}/products/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
