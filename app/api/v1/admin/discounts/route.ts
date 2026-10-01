import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { count, desc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
} from "@/lib/api-utils";
import {
  discountFieldsSchema,
  discountRuleError,
  discountState,
  type DiscountRecord,
} from "@/lib/services/discounts";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function present(d: DiscountRecord) {
  return {
    ...d,
    value: Number(d.value),
    minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
    state: discountState(d),
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return apiError("Invalid query", 422);
    const { page, limit } = parsed.data;

    const [{ total }] = await db.select({ total: count() }).from(discounts);
    const rows = await db
      .select()
      .from(discounts)
      .orderBy(desc(discounts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return withCors(apiSuccess({ discounts: rows.map(present), pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/discounts error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, discountFieldsSchema);
    if (error) return error;
    const d = data!;

    const startsAt = d.startsAt ? new Date(d.startsAt) : null;
    const expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;
    const problem = discountRuleError({
      discountType: d.discountType,
      value: d.value,
      maxUses: d.maxUses ?? null,
      usedCount: 0,
      startsAt,
      expiresAt,
    });
    if (problem) return withCors(apiError(problem, 422), req);

    let discount: DiscountRecord;
    try {
      [discount] = await db
        .insert(discounts)
        .values({
          code: d.code,
          discountType: d.discountType,
          value: String(d.value),
          minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : null,
          maxUses: d.maxUses ?? null,
          startsAt,
          expiresAt,
          isActive: d.isActive ?? true,
        })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) return withCors(apiError(`There's already a code called ${d.code}`, 409), req);
      throw err;
    }

    await auditLog(session.user.id, "create", "discount", { discountId: discount.id, code: discount.code });
    return withCors(apiSuccess(present(discount), 201), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/discounts error:", err);
    return apiError("Internal server error", 500);
  }
}
