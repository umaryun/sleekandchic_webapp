import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreProduct } from "@/lib/services/storefront";
import { variantOptions } from "@/lib/variants";
import { siteUrl } from "@/lib/env";
import { STORE } from "@/lib/store";
import ProductView from "./ProductView";

// One database read shared by the metadata and the page.
const loadProduct = cache(getStoreProduct);

type Props = { params: Promise<{ slug: string }> };

function summary(text: string | null | undefined, fallback: string) {
  const plain = (text ?? "").replace(/\s+/g, " ").trim();
  if (!plain) return fallback;
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: `Not found | ${STORE.name}`, robots: { index: false } };

  const description = summary(
    product.description,
    `${product.name}${product.category ? ` (${product.category})` : ""} from ${STORE.name}. Delivered across Nigeria.`
  );
  const images = (product.images ?? []).slice(0, 4).map((img) => ({ url: img.imageUrl, alt: img.altText || product.name }));
  return {
    title: `${product.name} | ${STORE.name}`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${product.slug}`,
      siteName: STORE.name,
      locale: "en_NG",
      type: "website",
      images,
    },
    twitter: { card: images.length ? "summary_large_image" : "summary", title: product.name, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const options = variantOptions(product.variants ?? []);
  const inStock = product.inStock !== false && (product.variants?.length ? options.anyInStock : true);
  const prices = product.variants?.length
    ? product.variants.map((v) => v.priceOverride ?? product.price)
    : [product.price];
  const url = `${siteUrl}/products/${product.slug}`;

  // Product details for search results (price, stock, photos).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: (product.images ?? []).map((i) => i.imageUrl),
    brand: { "@type": "Brand", name: product.brand || STORE.name },
    category: product.category ?? undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "NGN",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
      seller: { "@type": "Organization", name: STORE.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so product text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView key={product.id} product={product} />
    </>
  );
}
