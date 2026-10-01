import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, productImages, productVariants, products } from "@/lib/db/schema";
import { activeVariantsOf } from "@/lib/services/catalog";
import { displayBadge, saleInfo } from "@/lib/pricing";
import type { Product } from "@/types";

/** A product on sale, as the shop shows it, or null when it isn't for sale. */
export async function getStoreProduct(slug: string): Promise<Product | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (!product) return null;

  const [images, variants, category] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.displayOrder)),
    db.select().from(productVariants).where(activeVariantsOf(product.id)),
    product.categoryId
      ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1).then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  const price = Number(product.price);
  const sale = saleInfo(price, product.originalPrice ? Number(product.originalPrice) : null);

  const mappedImages = images.map((i) => ({
    id: i.id,
    imageUrl: i.imageUrl,
    altText: i.altText,
    displayOrder: i.displayOrder,
  }));

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price,
    originalPrice: sale.originalPrice,
    sku: product.sku,
    brand: product.brand,
    badge: displayBadge(sale.onSale, product.badge),
    discount: sale.discountPercent,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    image: mappedImages[0]?.imageUrl || null,
    images: mappedImages,
    variants: variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
    category: category?.name || null,
    categorySlug: category?.slug || null,
    categoryObj: category ? { id: category.id, name: category.name, slug: category.slug } : null,
  };
}
