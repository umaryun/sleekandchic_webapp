import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const slides = await db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.isActive, true))
      .orderBy(asc(heroSlides.displayOrder));

    const response = apiSuccess(slides);
    response.headers.set(
      "Cache-Control",
      // Short, so slide edits show up within a minute.
      "public, s-maxage=60, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("GET /api/v1/store/hero-slides error:", err);
    return apiError("Internal server error", 500);
  }
}
