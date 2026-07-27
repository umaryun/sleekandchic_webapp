import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  productVariants,
  categories,
} from "@/lib/db/schema";
import { eq, ilike, count, asc, desc, sql } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  slugify,
  paginationMeta,
} from "@/lib/api-utils";

// ──────────────────────────────────────────────
// GET — List products (with search, pagination)
// ──────────────────────────────────────────────

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return apiError("Invalid query parameters", 422);
    }

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? ilike(products.name, `%${search}%`)
      : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    const rows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Get first image per product
    const productIds = rows.map((r) => r.id);
    const images =
      productIds.length > 0
        ? await db
            .select({
              productId: productImages.productId,
              imageUrl: productImages.imageUrl,
            })
            .from(productImages)
            .where(sql`${productImages.productId} IN ${productIds}`)
            .orderBy(asc(productImages.displayOrder))
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, img.imageUrl);
      }
    }

    const data = rows.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      image: imageMap.get(p.id) || null,
    }));

    const response = apiSuccess({
      products: data,
      pagination: paginationMeta(total, page, limit),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/products error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// POST — Create product
// ──────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  badge: z.enum(["sale", "new", "hot"]).optional(),
  discount: z.number().int().min(0).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  inStock: z.boolean().default(true),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url(),
        altText: z.string().optional(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        size: z.string().optional(),
        color: z.string().optional(),
        stockQuantity: z.number().int().min(0).default(0),
        priceOverride: z.number().positive().optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createProductSchema);
    if (error) return error;

    const {
      name,
      description,
      price,
      originalPrice,
      sku,
      brand,
      badge,
      discount,
      categoryId,
      inStock,
      images,
      variants,
    } = data!;

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const [product] = await db
      .insert(products)
      .values({
        name,
        slug,
        description,
        price: String(price),
        originalPrice: originalPrice ? String(originalPrice) : null,
        sku,
        brand,
        badge: badge || null,
        discount,
        categoryId: categoryId || null,
        inStock,
      })
      .returning();

    // Insert images
    if (images && images.length > 0) {
      await db.insert(productImages).values(
        images.map((img, i) => ({
          productId: product.id,
          imageUrl: img.imageUrl,
          altText: img.altText || null,
          displayOrder: i,
        }))
      );
    }

    // Insert variants
    if (variants && variants.length > 0) {
      await db.insert(productVariants).values(
        variants.map((v) => ({
          productId: product.id,
          size: v.size || null,
          color: v.color || null,
          stockQuantity: v.stockQuantity,
          priceOverride: v.priceOverride ? String(v.priceOverride) : null,
        }))
      );
    }

    await auditLog(session.user.id, "create", "product", {
      productId: product.id,
      name: product.name,
    });

    const response = apiSuccess(product, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/products error:", err);
    return apiError("Internal server error", 500);
  }
}
