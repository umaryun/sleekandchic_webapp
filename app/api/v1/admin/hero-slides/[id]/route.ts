import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { slideFieldsSchema } from "@/lib/services/hero-slides";
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

    const { data, error } = await parseBody(req, slideFieldsSchema.partial());
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
    const session = await requireSuperAdmin(req);
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
