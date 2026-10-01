import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, productImages, productVariants } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { activeVariantsOf, duplicateCombos, syncVariants, variantColourSchema } from "@/lib/services/catalog";

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

    // Archived variants are kept for order history but can't be edited.
    const variants = await db
      .select()
      .from(productVariants)
      .where(activeVariantsOf(id))
      .orderBy(asc(productVariants.size), asc(productVariants.color));

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
  status: z.enum(["draft", "active", "archived"]).optional(),
  isFeatured: z.boolean().optional(),
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
        // Matched against this product's variants; anything else is treated as new.
        id: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        color: variantColourSchema.optional().nullable(),
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

    if (data!.variants) {
      const dupes = duplicateCombos(data!.variants);
      if (dupes.length > 0) {
        return withCors(apiError(`Each size and colour can be listed once. Repeated: ${dupes.join(", ")}`, 422), req);
      }
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
    if (data!.status !== undefined) updates.status = data!.status;
    if (data!.isFeatured !== undefined) updates.isFeatured = data!.isFeatured;
    if (data!.inStock !== undefined) updates.inStock = data!.inStock;

    // One transaction, so a failure part-way never leaves the product without
    // its images or variants.
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(products).set(updates).where(eq(products.id, id)).returning();

      if (data!.images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        if (data!.images.length > 0) {
          await tx.insert(productImages).values(
            data!.images.map((img, i) => ({
              productId: id,
              imageUrl: img.imageUrl,
              altText: img.altText || null,
              displayOrder: i,
            }))
          );
        }
      }

      // Variants are updated in place so bags, orders and stock history keep
      // pointing at them.
      if (data!.variants !== undefined) {
        await syncVariants(tx, id, data!.variants, session.user.id);
      }
      return row;
    });

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
    const session = await requireSuperAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return apiError("Product not found", 404);
    }

    // Archived, not deleted: past orders, stock history and bags still refer
    // to it. It disappears from the shop and can be restored.
    await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, id));

    await auditLog(session.user.id, "archive", "product", {
      productId: id,
      name: existing.name,
    });

    const response = apiSuccess({ archived: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/admin/products/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}
