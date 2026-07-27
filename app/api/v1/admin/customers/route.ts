import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { eq, desc, count, sum, sql, ilike, or } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  paginationMeta,
} from "@/lib/api-utils";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) return apiError("Invalid query parameters", 422);

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    const customerRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isAnonymous: users.isAnonymous,
        createdAt: users.createdAt,
        totalOrders: count(orders.id),
        totalSpent: sum(orders.totalAmount),
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(whereClause)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const data = customerRows.map((c) => ({
      ...c,
      totalOrders: Number(c.totalOrders || 0),
      totalSpent: Number(c.totalSpent || 0),
    }));

    const response = apiSuccess({
      customers: data,
      pagination: paginationMeta(total, page, limit),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/customers error:", err);
    return apiError("Internal server error", 500);
  }
}
