import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, internalError, paginationMeta, requireAdmin, withCors } from "@/lib/api-utils";
import { listMovements } from "@/lib/services/inventory";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  variantId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

/** GET /admin/inventory/movements — stock history (sales, cancellations, restocks, counts). */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Invalid query parameters", 422), req);
    const { page, limit } = parsed.data;
    const { movements, total } = await listMovements(parsed.data);
    return withCors(apiSuccess({ movements, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/inventory/movements", err);
  }
}
