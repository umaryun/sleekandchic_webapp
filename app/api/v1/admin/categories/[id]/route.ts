import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().optional(),
      iconUrl: z.string().url().nullable().optional(),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().optional(),
    });

    const { data, error } = await parseBody(req, updateSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) return apiError("Category not found", 404);

    const [updated] = await db
      .update(categories)
      .set(data!)
      .where(eq(categories.id, id))
      .returning();

    await auditLog(session.user.id, "update", "category", {
      categoryId: id,
      changes: data,
    });

    const response = apiSuccess(updated);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
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

    await db.delete(categories).where(eq(categories.id, id));

    await auditLog(session.user.id, "delete", "category", {
      categoryId: id,
      name: existing.name,
    });

    const response = apiSuccess({ deleted: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
