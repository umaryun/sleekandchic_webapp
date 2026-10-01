import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { categoryFieldsSchema, parentProblem } from "@/lib/services/categories";
import { count, eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
  internalError,
} from "@/lib/api-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const { data, error } = await parseBody(req, categoryFieldsSchema.partial());
    if (error) return error;

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) return apiError("Category not found", 404);
    if (data!.parentId !== undefined) {
      const problem = await parentProblem(id, data!.parentId);
      if (problem) return withCors(apiError(problem, 422), req);
    }

    let updated: typeof categories.$inferSelect;
    try {
      [updated] = await db.update(categories).set(data!).where(eq(categories.id, id)).returning();
    } catch (err) {
      if (isUniqueViolation(err)) return withCors(apiError(`A category already uses the address /${data!.slug}`, 409), req);
      throw err;
    }

    await auditLog(session.user.id, "update", "category", {
      categoryId: id,
      changes: data,
    });

    const response = apiSuccess(updated);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("PUT /api/v1/admin/categories/[id]", err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) return apiError("Category not found", 404);

    // Subcategories move to the top level and its products become
    // uncategorised (both via ON DELETE SET NULL); say how many.
    const [[{ children }], [{ items }]] = await Promise.all([
      db.select({ children: count() }).from(categories).where(eq(categories.parentId, id)),
      db.select({ items: count() }).from(products).where(eq(products.categoryId, id)),
    ]);
    await db.delete(categories).where(eq(categories.id, id));

    await auditLog(session.user.id, "delete", "category", {
      categoryId: id,
      name: existing.name,
      subcategoriesMovedUp: children,
      productsUncategorised: items,
    });

    const response = apiSuccess({ deleted: true, subcategoriesMovedUp: children, productsUncategorised: items });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("DELETE /api/v1/admin/categories/[id]", err);
  }
}
