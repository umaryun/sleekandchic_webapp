import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { invalidateShippingCache } from "@/lib/shipping";

const bulkUpdateSchema = z.object({
  targetType: z.enum(["zone", "ids"]),
  zone: z.string().optional(),
  ids: z.array(z.string()).optional(),
  standardBase: z.number().int().min(0).optional(),
  expressBase: z.number().int().min(0).optional(),
  estimatedDaysStandard: z.string().min(1).optional(),
  estimatedDaysExpress: z.string().min(1).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * POST /api/v1/admin/shipping/bulk
 * Bulk update shipping fees by Zone or list of IDs
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, bulkUpdateSchema);
    if (error) return error;

    const {
      targetType,
      zone,
      ids,
      standardBase,
      expressBase,
      estimatedDaysStandard,
      estimatedDaysExpress,
      freeShippingThreshold,
      isActive,
    } = data!;

    const updates: Partial<typeof shippingRates.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (standardBase !== undefined) updates.standardBase = standardBase;
    if (expressBase !== undefined) updates.expressBase = expressBase;
    if (estimatedDaysStandard !== undefined) updates.estimatedDaysStandard = estimatedDaysStandard;
    if (estimatedDaysExpress !== undefined) updates.estimatedDaysExpress = estimatedDaysExpress;
    if (freeShippingThreshold !== undefined) updates.freeShippingThreshold = freeShippingThreshold;
    if (isActive !== undefined) updates.isActive = isActive;

    let updatedRows: Array<{ id: string; state: string; zone: string }> = [];

    if (targetType === "zone") {
      if (!zone) return apiError("Zone is required for zone target type", 422);

      updatedRows = await db
        .update(shippingRates)
        .set(updates)
        .where(eq(shippingRates.zone, zone.toUpperCase()))
        .returning({
          id: shippingRates.id,
          state: shippingRates.state,
          zone: shippingRates.zone,
        });
    } else if (targetType === "ids") {
      if (!ids || ids.length === 0) return apiError("IDs array cannot be empty", 422);

      updatedRows = await db
        .update(shippingRates)
        .set(updates)
        .where(inArray(shippingRates.id, ids))
        .returning({
          id: shippingRates.id,
          state: shippingRates.state,
          zone: shippingRates.zone,
        });
    }

    // Invalidate cache immediately
    invalidateShippingCache();

    await auditLog(session.user.id, "bulk_update", "shipping_rates", {
      targetType,
      zone,
      count: updatedRows.length,
      updates,
    });

    const response = apiSuccess({
      updatedCount: updatedRows.length,
      affectedStates: updatedRows.map((r) => r.state),
    });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/shipping/bulk error:", err);
    return apiError("Internal server error", 500);
  }
}
