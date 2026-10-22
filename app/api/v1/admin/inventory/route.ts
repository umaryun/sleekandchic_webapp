import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, internalError, paginationMeta, requireAdmin, withCors } from "@/lib/api-utils";
import { listInventory } from "@/lib/services/inventory";
import { getSettings } from "@/lib/services/settings";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  stock: z.enum(["all", "low", "out", "in"]).default("all"),
  sort: z.enum(["stock", "name"]).default("stock"),
});

/** GET /admin/inventory — every size on sale with its stock, emptiest first. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Invalid query parameters", 422), req);
    const { page, limit, ...filters } = parsed.data;
    const { inventory } = await getSettings();
    const { items, total, summary } = await listInventory({ page, limit, ...filters, threshold: inventory.lowStockThreshold });
    return withCors(apiSuccess({ items, summary, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/inventory", err);
  }
}
