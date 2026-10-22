import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  productVariants,
  categories,
} from "@/lib/db/schema";
import { and, eq, ilike, isNull, count, asc, desc, ne, or, sql } from "drizzle-orm";
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
import { duplicateCombos, syncVariants, variantColourSchema } from "@/lib/services/catalog";
import { firstImages } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";

// ──────────────────────────────────────────────
// GET — List products (search, filters, sorting, pagination)
// ──────────────────────────────────────────────

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  // Archived products are listed only when asked for.
  status: z.enum(["draft", "active", "archived"]).optional(),
  // A top-level category includes its subcategories; "none" is uncategorised.
  categoryId: z.union([z.string().uuid(), z.literal("none")]).optional(),
  // "untracked": no sizes, so stock isn't counted.
  stock: z.enum(["in", "low", "out", "untracked"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "name", "price_asc", "price_desc", "stock_asc", "updated"]).default("newest"),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) {
      return withCors(apiError("Invalid query parameters", 422), req);
    }

    const { page, limit, search, status, categoryId, stock, featured, sort } = parsed.data;
    const offset = (page - 1) * limit;
    const { inventory } = await getSettings();

    // Stock across a product's sizes on sale; null when it has none.
    const totalStock = sql<number | null>`(select sum(${productVariants.stockQuantity})::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.isActive})`;
    const lowestStock = sql<number | null>`(select min(${productVariants.stockQuantity})::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.isActive})`;
    const variantCount = sql<number>`(select count(*)::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.isActive})`;

    const term = search?.trim() ? `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const whereClause = and(
      term ? or(ilike(products.name, term), ilike(products.sku, term), ilike(products.brand, term)) : undefined,
      status ? eq(products.status, status) : ne(products.status, "archived"),
      categoryId === "none"
        ? isNull(products.categoryId)
        : categoryId
          ? or(
              eq(products.categoryId, categoryId),
              sql`${products.categoryId} in (select id from ${categories} where ${categories.parentId} = ${categoryId})`
            )
          : undefined,
      featured ? eq(products.isFeatured, featured === "true") : undefined,
      stock === "untracked" ? sql`${variantCount} = 0` : undefined,
      stock === "out" ? sql`${variantCount} > 0 and coalesce(${totalStock}, 0) <= 0` : undefined,
      stock === "low" ? sql`${variantCount} > 0 and ${lowestStock} <= ${inventory.lowStockThreshold} and coalesce(${totalStock}, 0) > 0` : undefined,
      stock === "in" ? sql`(${variantCount} = 0 or ${lowestStock} > ${inventory.lowStockThreshold})` : undefined
    );

    const orderBy = {
      newest: [desc(products.createdAt)],
      oldest: [asc(products.createdAt)],
      updated: [desc(products.updatedAt)],
      name: [asc(products.name)],
      price_asc: [asc(products.price), asc(products.name)],
      price_desc: [desc(products.price), asc(products.name)],
      stock_asc: [sql`${totalStock} asc nulls last`, asc(products.name)],
    }[sort];

    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    const rows = await db
      .select({
        product: products,
        categoryName: categories.name,
        totalStock,
        lowestStock,
        variantCount,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const images = await firstImages(rows.map((r) => r.product.id));

    const data = rows.map(({ product: p, categoryName, totalStock, lowestStock, variantCount }) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      image: images.get(p.id) ?? null,
      categoryName: categoryName ?? null,
      variantCount,
      totalStock: variantCount > 0 ? (totalStock ?? 0) : null,
      lowestStock: variantCount > 0 ? lowestStock : null,
    }));

    const response = apiSuccess({
      products: data,
      lowStockThreshold: inventory.lowStockThreshold,
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
  status: z.enum(["draft", "active"]).default("active"),
  isFeatured: z.boolean().default(false),
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
        color: variantColourSchema.optional(),
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
      status,
      isFeatured,
      images,
      variants,
    } = data!;

    const dupes = duplicateCombos(variants ?? []);
    if (dupes.length > 0) {
      return withCors(apiError(`Each size and colour can be listed once. Repeated: ${dupes.join(", ")}`, 422), req);
    }

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const product = await db.transaction(async (tx) => {
      const [row] = await tx
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
          status,
          isFeatured,
        })
        .returning();

      if (images && images.length > 0) {
        await tx.insert(productImages).values(
          images.map((img, i) => ({
            productId: row.id,
            imageUrl: img.imageUrl,
            altText: img.altText || null,
            displayOrder: i,
          }))
        );
      }

      // Records opening stock in the stock history.
      await syncVariants(tx, row.id, variants ?? [], session.user.id);
      return row;
    });

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
