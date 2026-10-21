import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, internalError, requireAdmin, withCors } from "@/lib/api-utils";
import { salesReport } from "@/lib/services/reports";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const querySchema = z
  .object({ from: day, to: day })
  .refine((q) => q.from <= q.to, "The start date must be on or before the end date")
  .refine((q) => (Date.parse(q.to) - Date.parse(q.from)) / 86_400_000 < 366, "Choose up to a year at a time");

/** GET /admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD — Lagos days, both included. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError(parsed.error.issues[0].message, 422), req);
    return withCors(apiSuccess(await salesReport(parsed.data.from, parsed.data.to)), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/reports/sales", err);
  }
}
