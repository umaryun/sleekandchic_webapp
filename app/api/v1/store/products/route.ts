import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, productImages, categories } from "@/lib/db/schema";
import { eq, ilike, and, gte, lte, sql, desc, asc, count } from "drizzle-orm";
import { apiSuccess, apiError, paginationMeta } from "@/lib/api-utils";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  badge: z.enum(["sale", "new", "hot"]).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "rating", "name"]).default("newest"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return apiError("Invalid query parameters", 422);
    }

    const { page, limit, category, search, minPrice, maxPrice, badge, sort } = parsed.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (category) {
      // Find category by slug
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);
      if (cat) {
        conditions.push(eq(products.categoryId, cat.id));
      }
    }

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(products.price, String(minPrice)));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, String(maxPrice)));
    }

    if (badge) {
      conditions.push(eq(products.badge, badge));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort
    const orderMap = {
      price_asc: asc(products.price),
      price_desc: desc(products.price),
      newest: desc(products.createdAt),
      rating: desc(products.rating),
      name: asc(products.name),
    };

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    // Fetch products with category info via left join
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        originalPrice: products.originalPrice,
        badge: products.badge,
        discount: products.discount,
        rating: products.rating,
        reviewCount: products.reviewCount,
        inStock: products.inStock,
        brand: products.brand,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderMap[sort])
      .limit(limit)
      .offset(offset);

    // Fetch first image for each product
    const productIds = rows.map((r) => r.id);
    const images =
      productIds.length > 0
        ? await db
            .select({
              productId: productImages.productId,
              imageUrl: productImages.imageUrl,
            })
            .from(productImages)
            .where(
              sql`${productImages.productId} IN ${productIds}`
            )
            .orderBy(asc(productImages.displayOrder))
        : [];

    // Map first image per product
    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, img.imageUrl);
      }
    }

    const data = rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      badge: p.badge,
      discount: p.discount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      inStock: p.inStock,
      brand: p.brand,
      category: p.categoryName || null,
      categorySlug: p.categorySlug || null,
      image: imageMap.get(p.id) || null,
    }));

    const response = apiSuccess({
      products: data,
      pagination: paginationMeta(total, page, limit),
    });

    // Cache for 60s, serve stale for 5min
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (err) {
    console.error("GET /api/v1/store/products error:", err);
    return apiError("Internal server error", 500);
  }
}
