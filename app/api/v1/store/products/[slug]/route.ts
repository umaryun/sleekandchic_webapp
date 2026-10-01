import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getStoreProduct } from "@/lib/services/storefront";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getStoreProduct(slug);
    if (!product) return apiError("Product not found", 404);

    const response = apiSuccess(product);
    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return response;
  } catch (err) {
    console.error("GET /api/v1/store/products/[slug] error:", err);
    return apiError("Internal server error", 500);
  }
}
