import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { categoryFieldsSchema, parentProblem } from "@/lib/services/categories";
import { asc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  slugify,
  internalError,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder));

    const response = apiSuccess(allCategories);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/categories", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, categoryFieldsSchema);
    if (error) return error;
    const d = data!;

    const slug = d.slug || slugify(d.name);
    if (!slug) return withCors(apiError("Use letters or numbers in the name", 422), req);
    const problem = await parentProblem(null, d.parentId);
    if (problem) return withCors(apiError(problem, 422), req);

    let category: typeof categories.$inferSelect;
    try {
      [category] = await db
        .insert(categories)
        .values({
          name: d.name,
          slug,
          iconUrl: d.iconUrl || null,
          parentId: d.parentId || null,
          displayOrder: d.displayOrder ?? 0,
        })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) return withCors(apiError(`A category already uses the address /${slug}`, 409), req);
      throw err;
    }

    await auditLog(session.user.id, "create", "category", {
      categoryId: category.id,
      name: category.name,
    });

    const response = apiSuccess(category, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/categories", err);
  }
}
