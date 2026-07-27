import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const updateSchema = z.object({
      code: z.string().min(1).transform((s) => s.toUpperCase()).optional(),
      discountType: z.enum(["percentage", "fixed_amount"]).optional(),
      value: z.number().positive().optional(),
      minOrderAmount: z.number().positive().nullable().optional(),
      maxUses: z.number().int().positive().nullable().optional(),
      startsAt: z.string().datetime().nullable().optional(),
      expiresAt: z.string().datetime().nullable().optional(),
      isActive: z.boolean().optional(),
    });

    const { data, error } = await parseBody(req, updateSchema);
    if (error) return error;

    const [existing] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!existing) return apiError("Discount not found", 404);

    const updates: Record<string, unknown> = {};
    if (data!.code !== undefined) updates.code = data!.code;
    if (data!.discountType !== undefined) updates.discountType = data!.discountType;
    if (data!.value !== undefined) updates.value = String(data!.value);
    if (data!.minOrderAmount !== undefined)
      updates.minOrderAmount = data!.minOrderAmount
        ? String(data!.minOrderAmount)
        : null;
    if (data!.maxUses !== undefined) updates.maxUses = data!.maxUses;
    if (data!.startsAt !== undefined)
      updates.startsAt = data!.startsAt ? new Date(data!.startsAt) : null;
    if (data!.expiresAt !== undefined)
      updates.expiresAt = data!.expiresAt ? new Date(data!.expiresAt) : null;
    if (data!.isActive !== undefined) updates.isActive = data!.isActive;

    const [updated] = await db
      .update(discounts)
      .set(updates)
      .where(eq(discounts.id, id))
      .returning();

    await auditLog(session.user.id, "update", "discount", {
      discountId: id,
      code: existing.code,
    });

    const response = apiSuccess(updated);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!existing) return apiError("Discount not found", 404);

    await db.delete(discounts).where(eq(discounts.id, id));

    await auditLog(session.user.id, "delete", "discount", {
      discountId: id,
      code: existing.code,
    });

    const response = apiSuccess({ deleted: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
