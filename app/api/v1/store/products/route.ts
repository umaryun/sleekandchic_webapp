import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, productImages, productVariants, categories } from "@/lib/db/schema";
import { eq, ilike, and, or, gte, lte, sql, desc, asc, count, inArray } from "drizzle-orm";
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

    // Build where conditions. Drafts and archived products aren't for sale.
    const conditions = [eq(products.status, "active")];

    if (category) {
      // Find category by slug
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);
      // An unknown category matches nothing rather than everything.
      conditions.push(cat ? eq(products.categoryId, cat.id) : sql`false`);
    }

    if (search?.trim()) {
      // Match name, description or category; escape LIKE wildcards in the input.
      const term = `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      conditions.push(or(ilike(products.name, term), ilike(products.description, term), ilike(categories.name, term))!);
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
      .leftJoin(categories, eq(products.categoryId, categories.id))
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

    // Enough about sizes for a card to add straight to the bag only when
    // there is nothing to choose.
    const variantRows =
      productIds.length > 0
        ? await db
            .select({
              productId: productVariants.productId,
              id: productVariants.id,
              stock: productVariants.stockQuantity,
            })
            .from(productVariants)
            .where(and(inArray(productVariants.productId, productIds), eq(productVariants.isActive, true)))
        : [];
    const variantsByProduct = new Map<string, { id: string; stock: number }[]>();
    for (const v of variantRows) {
      const list = variantsByProduct.get(v.productId) ?? [];
      list.push(v);
      variantsByProduct.set(v.productId, list);
    }

    const data = rows.map((p) => {
      const variants = variantsByProduct.get(p.id) ?? [];
      const soldOut = !p.inStock || (variants.length > 0 && variants.every((v) => v.stock <= 0));
      return {
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
        soldOut,
        hasOptions: variants.length > 1,
        singleVariantId: variants.length === 1 ? variants[0].id : null,
      };
    });

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
