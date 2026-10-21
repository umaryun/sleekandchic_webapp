import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { apiError, apiSuccess, auditLog, internalError, isSuperAdmin, parseBody, requireAdmin, withCors } from "@/lib/api-utils";

const bulkSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "Choose at least one product").max(200),
  action: z.enum(["publish", "draft", "feature", "unfeature", "archive", "restore", "set_category"]),
  // For set_category; null takes products out of their category.
  categoryId: z.string().uuid().nullable().optional(),
});

/** POST /admin/products/bulk — the same change to several products. Archiving is owner-only. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, bulkSchema);
    if (error) return withCors(error, req);
    const { productIds, action, categoryId } = data!;

    if ((action === "archive" || action === "restore") && !isSuperAdmin(session)) {
      return withCors(apiError("Only the store owner can do this", 403), req);
    }
    if (action === "set_category" && categoryId === undefined) {
      return withCors(apiError("Choose a category", 422), req);
    }
    if (action === "set_category" && categoryId) {
      const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
      if (!category) return withCors(apiError("That category no longer exists", 404), req);
    }

    const changes: Partial<typeof products.$inferInsert> = {
      publish: { status: "active" as const },
      draft: { status: "draft" as const },
      feature: { isFeatured: true },
      unfeature: { isFeatured: false },
      archive: { status: "archived" as const },
      restore: { status: "active" as const },
      set_category: { categoryId: categoryId ?? null },
    }[action];

    // Archived products stay archived unless restored.
    const scope =
      action === "restore"
        ? and(inArray(products.id, productIds), eq(products.status, "archived"))
        : action === "archive"
          ? inArray(products.id, productIds)
          : and(inArray(products.id, productIds), ne(products.status, "archived"));

    const updated = await db
      .update(products)
      .set({ ...changes, updatedAt: new Date() })
      .where(scope)
      .returning({ id: products.id, name: products.name });

    await auditLog(session.user.id, `bulk_${action}`, "product", {
      products: updated.map((p) => p.name),
      ...(action === "set_category" ? { categoryId } : {}),
    });
    return withCors(apiSuccess({ updated: updated.length }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/products/bulk", err);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
