import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, ilike, count, desc, and, or, inArray, sql } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  paginationMeta,
} from "@/lib/api-utils";
import { AdminUser, AdminRole } from "@/types";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  role: z.enum(["admin", "super_admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return apiError("Invalid query parameters", 422);
    }

    const { page, limit, search, role, status } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [];

    // Filter by admin roles
    if (role) {
      conditions.push(eq(users.role, role));
    } else {
      conditions.push(inArray(users.role, ["admin", "super_admin"]));
    }

    // Filter by status (banned vs active)
    if (status === "suspended") {
      conditions.push(eq(users.banned, true));
    } else if (status === "active") {
      conditions.push(or(eq(users.banned, false), sql`${users.banned} IS NULL`));
    }

    // Search by name or email
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch latest session for each user to populate lastLoginAt
    const userIds = userRows.map((u) => u.id);
    const sessionMap = new Map<string, Date>();

    if (userIds.length > 0) {
      const recentSessions = await db
        .select({
          userId: sessions.userId,
          updatedAt: sessions.updatedAt,
          createdAt: sessions.createdAt,
        })
        .from(sessions)
        .where(inArray(sessions.userId, userIds))
        .orderBy(desc(sessions.updatedAt));

      for (const s of recentSessions) {
        if (!sessionMap.has(s.userId)) {
          sessionMap.set(s.userId, s.updatedAt || s.createdAt);
        }
      }
    }

    const admins: AdminUser[] = userRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as AdminRole,
      status: u.banned ? "suspended" : "active",
      avatarUrl: u.image || null,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      lastLoginAt: sessionMap.has(u.id) ? sessionMap.get(u.id)!.toISOString() : null,
    }));

    const response = apiSuccess({
      admins,
      pagination: paginationMeta(total, page, limit),
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/team error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
