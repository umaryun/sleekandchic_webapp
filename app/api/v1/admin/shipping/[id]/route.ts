import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { invalidateShippingCache, ZONE_NAMES } from "@/lib/shipping";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const [rate] = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.id, id))
      .limit(1);

    if (!rate) return apiError("Shipping rate not found", 404);

    const response = apiSuccess({
      ...rate,
      zoneName: ZONE_NAMES[rate.zone] || `Zone ${rate.zone}`,
    });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/shipping/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

const updateShippingRateSchema = z.object({
  state: z.string().min(1).optional(),
  zone: z.string().min(1).optional(),
  standardBase: z.number().int().min(0).optional(),
  expressBase: z.number().int().min(0).optional(),
  estimatedDaysStandard: z.string().min(1).optional(),
  estimatedDaysExpress: z.string().min(1).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const { data, error } = await parseBody(req, updateShippingRateSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.id, id))
      .limit(1);

    if (!existing) return apiError("Shipping rate not found", 404);

    const updates: Partial<typeof shippingRates.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data!.state !== undefined) updates.state = data!.state.trim();
    if (data!.zone !== undefined) updates.zone = data!.zone.toUpperCase();
    if (data!.standardBase !== undefined) updates.standardBase = data!.standardBase;
    if (data!.expressBase !== undefined) updates.expressBase = data!.expressBase;
    if (data!.estimatedDaysStandard !== undefined)
      updates.estimatedDaysStandard = data!.estimatedDaysStandard;
    if (data!.estimatedDaysExpress !== undefined)
      updates.estimatedDaysExpress = data!.estimatedDaysExpress;
    if (data!.freeShippingThreshold !== undefined)
      updates.freeShippingThreshold = data!.freeShippingThreshold;
    if (data!.isActive !== undefined) updates.isActive = data!.isActive;

    const [updated] = await db
      .update(shippingRates)
      .set(updates)
      .where(eq(shippingRates.id, id))
      .returning();

    // Clear cache immediately
    invalidateShippingCache();

    await auditLog(session.user.id, "update", "shipping_rate", {
      id,
      state: updated.state,
      changes: updates,
    });

    const response = apiSuccess({
      ...updated,
      zoneName: ZONE_NAMES[updated.zone] || `Zone ${updated.zone}`,
    });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PUT /api/v1/admin/shipping/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.id, id))
      .limit(1);

    if (!existing) return apiError("Shipping rate not found", 404);

    await db.delete(shippingRates).where(eq(shippingRates.id, id));

    // Clear cache immediately
    invalidateShippingCache();

    await auditLog(session.user.id, "delete", "shipping_rate", {
      id,
      state: existing.state,
    });

    const response = apiSuccess({ deleted: true, id });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/admin/shipping/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}
