import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { asc, count } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
} from "@/lib/api-utils";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) return apiError("Invalid query", 422);

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const [{ total }] = await db.select({ total: count() }).from(discounts);

    const rows = await db
      .select()
      .from(discounts)
      .orderBy(asc(discounts.createdAt))
      .limit(limit)
      .offset(offset);

    const data = rows.map((d) => ({
      ...d,
      value: Number(d.value),
      minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
    }));

    const response = apiSuccess({
      discounts: data,
      pagination: paginationMeta(total, page, limit),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}

const createDiscountSchema = z.object({
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  discountType: z.enum(["percentage", "fixed_amount"]),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createDiscountSchema);
    if (error) return error;

    const [discount] = await db
      .insert(discounts)
      .values({
        code: data!.code,
        discountType: data!.discountType,
        value: String(data!.value),
        minOrderAmount: data!.minOrderAmount
          ? String(data!.minOrderAmount)
          : null,
        maxUses: data!.maxUses || null,
        startsAt: data!.startsAt ? new Date(data!.startsAt) : null,
        expiresAt: data!.expiresAt ? new Date(data!.expiresAt) : null,
        isActive: data!.isActive,
      })
      .returning();

    await auditLog(session.user.id, "create", "discount", {
      discountId: discount.id,
      code: discount.code,
    });

    const response = apiSuccess(discount, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
