import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, productImages, productVariants } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";

// ──────────────────────────────────────────────
// GET — Single product detail
// ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return apiError("Product not found", 404);
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.displayOrder));

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id));

    const response = apiSuccess({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : null,
      images,
      variants: variants.map((v) => ({
        ...v,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/products/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// PUT — Update product
// ──────────────────────────────────────────────

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().nullable().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  badge: z.enum(["sale", "new", "hot", "none"]).nullable().optional(),
  discount: z.number().int().min(0).max(100).nullable().optional(),
  categoryId: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().uuid().nullable().optional()
  ),
  inStock: z.boolean().optional(),
  images: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        imageUrl: z.string().min(1),
        altText: z.string().optional().nullable(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        stockQuantity: z.number().int().min(0).default(0),
        priceOverride: z.number().positive().nullable().optional(),
      })
    )
    .optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    const { data, error } = await parseBody(req, updateProductSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return apiError("Product not found", 404);
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data!.name !== undefined) updates.name = data!.name;
    if (data!.description !== undefined) updates.description = data!.description;
    if (data!.price !== undefined) updates.price = String(data!.price);
    if (data!.originalPrice !== undefined)
      updates.originalPrice = data!.originalPrice
        ? String(data!.originalPrice)
        : null;
    if (data!.sku !== undefined) updates.sku = data!.sku;
    if (data!.brand !== undefined) updates.brand = data!.brand;
    if (data!.badge !== undefined) updates.badge = data!.badge === "none" ? null : data!.badge;
    if (data!.discount !== undefined) updates.discount = data!.discount;
    if (data!.categoryId !== undefined) updates.categoryId = data!.categoryId;
    if (data!.inStock !== undefined) updates.inStock = data!.inStock;

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    // Replace images if provided
    if (data!.images !== undefined) {
      await db.delete(productImages).where(eq(productImages.productId, id));
      if (data!.images.length > 0) {
        await db.insert(productImages).values(
          data!.images.map((img, i) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || null,
            displayOrder: i,
          }))
        );
      }
    }

    // Replace variants if provided
    if (data!.variants !== undefined) {
      await db
        .delete(productVariants)
        .where(eq(productVariants.productId, id));
      if (data!.variants.length > 0) {
        await db.insert(productVariants).values(
          data!.variants.map((v) => ({
            productId: id,
            size: v.size || null,
            color: v.color || null,
            stockQuantity: v.stockQuantity,
            priceOverride: v.priceOverride ? String(v.priceOverride) : null,
          }))
        );
      }
    }

    await auditLog(session.user.id, "update", "product", {
      productId: id,
      changes: Object.keys(updates),
    });

    const response = apiSuccess(updated);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PUT /api/v1/admin/products/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// DELETE — Delete product
// ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return apiError("Product not found", 404);
    }

    // Cascade delete (images and variants deleted via FK cascade)
    await db.delete(products).where(eq(products.id, id));

    await auditLog(session.user.id, "delete", "product", {
      productId: id,
      name: existing.name,
    });

    const response = apiSuccess({ deleted: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/admin/products/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}
