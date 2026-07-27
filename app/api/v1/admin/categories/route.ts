import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc, count } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  slugify,
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
    return apiError("Internal server error", 500);
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  iconUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createCategorySchema);
    if (error) return error;

    const slug = data!.slug || slugify(data!.name);

    const [category] = await db
      .insert(categories)
      .values({
        name: data!.name,
        slug,
        iconUrl: data!.iconUrl || null,
        parentId: data!.parentId || null,
        displayOrder: data!.displayOrder,
      })
      .returning();

    await auditLog(session.user.id, "create", "category", {
      categoryId: category.id,
      name: category.name,
    });

    const response = apiSuccess(category, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
