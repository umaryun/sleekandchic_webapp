import { NextRequest } from "next/server";
import { apiSuccess, apiError, internalError, requireAdmin, withCors } from "@/lib/api-utils";
import { getCustomer } from "@/lib/services/customers";

/** GET /admin/customers/:id — id is "u:<userId>", "g:<email>" or "p:<phone>" (URL-encoded). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const raw = (await params).id;
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      // Already decoded.
    }
    if (!/^[ugp]:.+/.test(id)) return withCors(apiError("Customer not found", 404), req);
    const customer = await getCustomer(id);
    if (!customer) return withCors(apiError("Customer not found", 404), req);
    return withCors(apiSuccess(customer), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/customers/[id]", err);
  }
}
