import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
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
      boldText: z.string().nullable().optional(),
      regularText: z.string().nullable().optional(),
      linkText: z.string().nullable().optional(),
      href: z.string().nullable().optional(),
      imageUrl: z.string().url().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    });

    const { data, error } = await parseBody(req, updateSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.id, id))
      .limit(1);

    if (!existing) return apiError("Hero slide not found", 404);

    const [updated] = await db
      .update(heroSlides)
      .set(data!)
      .where(eq(heroSlides.id, id))
      .returning();

    await auditLog(session.user.id, "update", "hero_slide", { slideId: id });

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
    const session = await requireAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.id, id))
      .limit(1);

    if (!existing) return apiError("Hero slide not found", 404);

    await db.delete(heroSlides).where(eq(heroSlides.id, id));

    await auditLog(session.user.id, "delete", "hero_slide", { slideId: id });

    const response = apiSuccess({ deleted: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
