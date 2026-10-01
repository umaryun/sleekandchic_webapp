import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { discountFieldsSchema, discountRuleError, discountState, type DiscountRecord } from "@/lib/services/discounts";
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

const updateSchema = discountFieldsSchema.partial();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    const { data, error } = await parseBody(req, updateSchema);
    if (error) return error;
    const d = data!;

    const [existing] = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
    if (!existing) return withCors(apiError("Discount not found", 404), req);

    // Orders store the code they used; renaming a used code would cut them off
    // from it (cancelling them couldn't give the use back).
    if (d.code !== undefined && d.code !== existing.code && existing.usedCount > 0) {
      return withCors(apiError("This code has already been used, so it can't be renamed. Pause it and create a new one.", 409), req);
    }

    const toDate = (v: string | null | undefined, current: Date | null) =>
      v === undefined ? current : v === null ? null : new Date(v);
    const merged = {
      discountType: d.discountType ?? existing.discountType,
      value: d.value ?? Number(existing.value),
      maxUses: d.maxUses === undefined ? existing.maxUses : d.maxUses,
      usedCount: existing.usedCount,
      startsAt: toDate(d.startsAt, existing.startsAt),
      expiresAt: toDate(d.expiresAt, existing.expiresAt),
    };
    const problem = discountRuleError(merged);
    if (problem) return withCors(apiError(problem, 422), req);

    let updated: DiscountRecord;
    try {
      [updated] = await db
        .update(discounts)
        .set({
          ...(d.code !== undefined ? { code: d.code } : {}),
          discountType: merged.discountType,
          value: String(merged.value),
          ...(d.minOrderAmount !== undefined ? { minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : null } : {}),
          maxUses: merged.maxUses,
          startsAt: merged.startsAt,
          expiresAt: merged.expiresAt,
          ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        })
        .where(eq(discounts.id, id))
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) return withCors(apiError(`There's already a code called ${d.code}`, 409), req);
      throw err;
    }

    await auditLog(session.user.id, "update", "discount", { discountId: id, code: updated.code, changes: d });

    return withCors(
      apiSuccess({
        ...updated,
        value: Number(updated.value),
        minOrderAmount: updated.minOrderAmount ? Number(updated.minOrderAmount) : null,
        state: discountState(updated),
      }),
      req
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PUT /api/v1/admin/discounts/[id] error:", err);
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
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!existing) return apiError("Discount not found", 404);
    if (existing.usedCount > 0) {
      return withCors(
        apiError(`${existing.code} has been used ${existing.usedCount} times and is kept for those orders. Pause it instead.`, 409),
        req
      );
    }

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
