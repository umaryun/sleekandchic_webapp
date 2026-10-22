import { NextRequest } from "next/server";
import { apiError, apiSuccess, auditLog, internalError, parseBody, requireAdmin, withCors } from "@/lib/api-utils";
import { adjustmentSchema, adjustStock, InventoryError } from "@/lib/services/inventory";

/** POST /admin/inventory/adjust — add, remove or set one size's stock, with a reason. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, adjustmentSchema);
    if (error) return withCors(error, req);

    let result;
    try {
      result = await adjustStock(data!, session.user.id);
    } catch (err) {
      if (err instanceof InventoryError) return withCors(apiError(err.message, err.status), req);
      throw err;
    }

    if (result.changed) {
      await auditLog(session.user.id, "adjust_stock", "inventory", {
        variantId: data!.variantId,
        productId: result.productId,
        reason: data!.reason,
        from: result.before,
        to: result.after,
      });
    }
    return withCors(apiSuccess({ stock: result.after, previous: result.before }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/inventory/adjust", err);
  }
}
