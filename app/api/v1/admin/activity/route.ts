import { NextRequest } from "next/server";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { apiError, apiSuccess, internalError, paginationMeta, requireSuperAdmin, withCors } from "@/lib/api-utils";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  adminId: z.string().max(100).optional(),
  resource: z.string().max(50).optional(),
});

/** GET /admin/activity — who changed what in the admin (owner only). */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Invalid query parameters", 422), req);
    const { page, limit, adminId, resource } = parsed.data;

    const where = and(
      adminId ? eq(auditLogs.adminId, adminId) : undefined,
      resource ? eq(auditLogs.resource, resource) : undefined
    );
    const [[{ total }], entries, staff] = await Promise.all([
      db.select({ total: count() }).from(auditLogs).where(where),
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resource: auditLogs.resource,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
          adminId: auditLogs.adminId,
          adminName: users.name,
          adminEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.adminId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      // Everyone who appears in the log, for the filter.
      db
        .selectDistinct({ id: users.id, name: users.name })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.adminId, users.id)),
    ]);
    return withCors(apiSuccess({ entries, staff, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/activity", err);
  }
}
