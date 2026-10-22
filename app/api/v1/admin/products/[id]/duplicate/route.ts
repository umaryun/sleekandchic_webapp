import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages, products, productVariants } from "@/lib/db/schema";
import { apiError, apiSuccess, auditLog, internalError, requireAdmin, slugify, withCors } from "@/lib/api-utils";
import { activeVariantsOf } from "@/lib/services/catalog";

/**
 * POST /admin/products/:id/duplicate — a draft copy with the same details,
 * photos and sizes, and no stock, for adding a similar piece quickly.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    const [source] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!source) return withCors(apiError("Product not found", 404), req);

    const copy = await db.transaction(async (tx) => {
      const name = `${source.name} (copy)`.slice(0, 255);
      const [row] = await tx
        .insert(products)
        .values({
          name,
          slug: `${slugify(name)}-${Date.now().toString(36)}`,
          description: source.description,
          price: source.price,
          originalPrice: source.originalPrice,
          sku: null,
          brand: source.brand,
          badge: source.badge,
          discount: source.discount,
          categoryId: source.categoryId,
          inStock: true,
          status: "draft",
          isFeatured: false,
        })
        .returning();

      const images = await tx.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.displayOrder));
      if (images.length > 0) {
        await tx.insert(productImages).values(
          images.map((img) => ({ productId: row.id, imageUrl: img.imageUrl, altText: img.altText, displayOrder: img.displayOrder }))
        );
      }
      const variants = await tx.select().from(productVariants).where(activeVariantsOf(id));
      if (variants.length > 0) {
        await tx.insert(productVariants).values(
          variants.map((v) => ({ productId: row.id, size: v.size, color: v.color, priceOverride: v.priceOverride, stockQuantity: 0 }))
        );
      }
      return row;
    });

    await auditLog(session.user.id, "duplicate", "product", { productId: copy.id, from: source.name });
    return withCors(apiSuccess({ id: copy.id, name: copy.name }, 201), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/products/[id]/duplicate", err);
  }
}
