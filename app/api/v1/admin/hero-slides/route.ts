import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { asc, count } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
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
    return apiError("Internal server error", 500);
  }
}

const createSlideSchema = z.object({
  boldText: z.string().optional(),
  regularText: z.string().optional(),
  linkText: z.string().optional(),
  href: z.string().optional(),
  imageUrl: z.string().url(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createSlideSchema);
    if (error) return error;

    const [slide] = await db
      .insert(heroSlides)
      .values({
        boldText: data!.boldText || null,
        regularText: data!.regularText || null,
        linkText: data!.linkText || null,
        href: data!.href || null,
        imageUrl: data!.imageUrl,
        displayOrder: data!.displayOrder,
        isActive: data!.isActive,
      })
      .returning();

    await auditLog(session.user.id, "create", "hero_slide", {
      slideId: slide.id,
    });

    const response = apiSuccess(slide, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
