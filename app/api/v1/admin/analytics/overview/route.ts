import { NextRequest } from "next/server";
import { apiSuccess, apiError, requireAdmin, withCors } from "@/lib/api-utils";
import { getOverview } from "@/lib/services/analytics";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    return withCors(apiSuccess(await getOverview()), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/analytics/overview error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
