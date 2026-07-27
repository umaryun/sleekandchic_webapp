import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, productVariants, categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) {
      return apiError("Product not found", 404);
    }

    // Fetch images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.displayOrder));

    // Fetch variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));

    // Fetch category
    let category = null;
    if (product.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);
      category = cat || null;
    }

    const mappedImages = images.map((i) => ({
      id: i.id,
      imageUrl: i.imageUrl,
      altText: i.altText,
      displayOrder: i.displayOrder,
    }));

    const mappedVariants = variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    }));

    const data = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : null,
      sku: product.sku,
      brand: product.brand,
      badge: product.badge,
      discount: product.discount,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      image: mappedImages[0]?.imageUrl || null,
      images: mappedImages,
      variants: mappedVariants,
      category: category?.name || null,
      categorySlug: category?.slug || null,
      categoryObj: category
        ? { id: category.id, name: category.name, slug: category.slug }
        : null,
    };

    const response = apiSuccess(data);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("GET /api/v1/store/products/[slug] error:", err);
    return apiError("Internal server error", 500);
  }
}

