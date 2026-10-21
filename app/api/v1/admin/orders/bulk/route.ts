import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiSuccess, auditLog, internalError, parseBody, requireAdmin, withCors } from "@/lib/api-utils";
import { applyStaffChanges, StaffOrderError } from "@/lib/services/staff-orders";
import { afterResponse } from "@/lib/email/send";
import { notifyStatusChange } from "@/lib/email/notify";

const bulkSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, "Choose at least one order").max(100, "Choose up to 100 orders at a time"),
  status: z.enum(["processing", "shipped", "delivered"]).optional(),
  paymentStatus: z.enum(["paid"]).optional(),
}).refine((b) => b.status || b.paymentStatus, "Choose what to change");

/**
 * POST /admin/orders/bulk — moves several orders on at once (e.g. everything
 * sent on dispatch day to Shipped). Each order follows the usual rules; the
 * ones that can't move are listed with the reason, the rest are saved.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, bulkSchema);
    if (error) return withCors(error, req);
    const { orderIds, status, paymentStatus } = data!;

    const updated: { id: string; orderNumber: string }[] = [];
    const skipped: { id: string; orderNumber: string | null; reason: string }[] = [];

    for (const id of [...new Set(orderIds)]) {
      try {
        const { before, after } = await db.transaction((tx) => applyStaffChanges(tx, id, { status, paymentStatus }, session.user.id));
        const changed = after.status !== before.status || after.paymentStatus !== before.paymentStatus;
        if (!changed) {
          skipped.push({ id, orderNumber: before.orderNumber, reason: "Already done" });
          continue;
        }
        updated.push({ id, orderNumber: after.orderNumber });
        if (status && status !== before.status) afterResponse(() => notifyStatusChange(id, status));
      } catch (err) {
        if (!(err instanceof StaffOrderError)) throw err;
        skipped.push({ id, orderNumber: null, reason: err.message });
      }
    }

    if (updated.length > 0) {
      await auditLog(session.user.id, "bulk_update", "order", {
        orders: updated.map((o) => o.orderNumber),
        status,
        paymentStatus,
      });
    }
    return withCors(apiSuccess({ updated, skipped }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/orders/bulk", err);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
