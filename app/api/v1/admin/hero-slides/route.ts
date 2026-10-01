import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { slideFieldsSchema } from "@/lib/services/hero-slides";
import { asc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  internalError,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const slides = await db
      .select()
      .from(heroSlides)
      .orderBy(asc(heroSlides.displayOrder));

    const response = apiSuccess(slides);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/hero-slides", err);
  }
}

const createSlideSchema = slideFieldsSchema;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createSlideSchema);
    if (error) return error;

    const [slide] = await db
      .insert(heroSlides)
      .values({
        boldText: data!.boldText ?? null,
        regularText: data!.regularText ?? null,
        linkText: data!.linkText ?? null,
        href: data!.href ?? null,
        imageUrl: data!.imageUrl,
        displayOrder: data!.displayOrder ?? 0,
        isActive: data!.isActive ?? true,
      })
      .returning();

    await auditLog(session.user.id, "create", "hero_slide", {
      slideId: slide.id,
    });

    const response = apiSuccess(slide, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/hero-slides", err);
  }
}
