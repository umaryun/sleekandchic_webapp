import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, requireAdmin, withCors, paginationMeta } from "@/lib/api-utils";
import { listCustomers } from "@/lib/services/customers";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return apiError("Invalid query parameters", 422);
    const { page, limit, search } = parsed.data;

    const { customers, total } = await listCustomers({ page, limit, search });
    return withCors(apiSuccess({ customers, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/customers error:", err);
    return apiError("Internal server error", 500);
  }
}
