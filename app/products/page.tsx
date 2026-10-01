import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { STORE } from "@/lib/store";
import ProductsBrowser from "./ProductsBrowser";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const slug = first(params.category);
  const search = first(params.search).trim();

  // Search results and filtered/paged views aren't pages of their own for search engines.
  const filtered = Boolean(search || first(params.page) || first(params.sort));

  if (slug) {
    const [category] = await db.select({ name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (category) {
      return {
        title: `${category.name} | ${STORE.name}`,
        description: `Shop ${category.name.toLowerCase()} at ${STORE.name}. Delivered across Nigeria, with pay on delivery available.`,
        alternates: { canonical: `/products?category=${category.slug}` },
        robots: filtered ? { index: false, follow: true } : undefined,
      };
    }
  }

  if (search) {
    return { title: `Search: ${search} | ${STORE.name}`, robots: { index: false, follow: true } };
  }

  return {
    title: first(params.sale) === "1" ? `Sale | ${STORE.name}` : `All products | ${STORE.name}`,
    description: `Abayas, bubu, kaftans, gowns and more from ${STORE.name}, delivered across Nigeria.`,
    alternates: { canonical: first(params.sale) === "1" ? "/products?sale=1" : "/products" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default function ProductsPage() {
  return <ProductsBrowser />;
}
