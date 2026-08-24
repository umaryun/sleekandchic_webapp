import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, and, or, inArray, count, sql, desc } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { AdminUser, AdminRole } from "@/types";

// ──────────────────────────────────────────────
// GET — Single admin details
// ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const [user] = await db
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
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return apiError("Admin user not found", 404);
    }

    const [recentSession] = await db
      .select({
        updatedAt: sessions.updatedAt,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, id))
      .orderBy(desc(sessions.updatedAt))
      .limit(1);

    const adminUser: AdminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as AdminRole,
      status: user.banned ? "suspended" : "active",
      avatarUrl: user.image || null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      lastLoginAt: recentSession ? (recentSession.updatedAt || recentSession.createdAt).toISOString() : null,
    };

    const response = apiSuccess(adminUser);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/team/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// PUT / PATCH — Update admin role and status
// ──────────────────────────────────────────────

const updateAdminSchema = z.object({
  role: z.enum(["admin", "super_admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

async function handleUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const session = await requireSuperAdmin(req);
    const { id } = await params;
    const { data, error } = await parseBody(req, updateAdminSchema);
    if (error) return error;

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    const isSelf = session.user.id === id;

    // Self-protection guard
    if (isSelf) {
      if (data?.role === "admin" && targetUser.role === "super_admin") {
        return apiError("Cannot demote your own super admin account", 400);
      }
      if (data?.status === "suspended") {
        return apiError("Cannot suspend your own account", 400);
      }
    }

    // Last active super admin protection guard
    if (
      targetUser.role === "super_admin" &&
      (data?.role === "admin" || data?.status === "suspended")
    ) {
      const [{ activeSuperAdmins }] = await db
        .select({ activeSuperAdmins: count() })
        .from(users)
        .where(
          and(
            eq(users.role, "super_admin"),
            or(eq(users.banned, false), sql`${users.banned} IS NULL`)
          )
        );

      if (Number(activeSuperAdmins) <= 1) {
        return apiError(
          "Cannot demote or suspend the last remaining active super admin",
          400
        );
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data?.role !== undefined) {
      updates.role = data.role;
    }

    if (data?.status !== undefined) {
      const isSuspended = data.status === "suspended";
      updates.banned = isSuspended;
      updates.banReason = isSuspended ? "Suspended by Super Admin" : null;
      updates.banExpires = null;
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    // If account was suspended, terminate all active sessions immediately
    if (data?.status === "suspended") {
      await db.delete(sessions).where(eq(sessions.userId, id));
    }

    await auditLog(session.user.id, "update_admin_role", "admin_user", {
      targetId: id,
      targetEmail: targetUser.email,
      changes: {
        role: data?.role,
        status: data?.status,
      },
    });

    const adminUser: AdminUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role as AdminRole,
      status: updated.banned ? "suspended" : "active",
      avatarUrl: updated.image || null,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
      lastLoginAt: null,
    };

    const response = apiSuccess(adminUser);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PUT /api/v1/admin/team/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ──────────────────────────────────────────────
// DELETE — Revoke administrator access
// ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin(req);
    const { id } = await params;

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    // Prevent self-revocation
    if (session.user.id === id) {
      return apiError("Cannot revoke your own admin access", 400);
    }

    // Last active super admin protection guard
    if (targetUser.role === "super_admin") {
      const [{ activeSuperAdmins }] = await db
        .select({ activeSuperAdmins: count() })
        .from(users)
        .where(
          and(
            eq(users.role, "super_admin"),
            or(eq(users.banned, false), sql`${users.banned} IS NULL`)
          )
        );

      if (Number(activeSuperAdmins) <= 1) {
        return apiError(
          "Cannot revoke access for the last remaining active super admin",
          400
        );
      }
    }

    // Demote role to customer and revoke active sessions
    await db
      .update(users)
      .set({
        role: "customer",
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    await db.delete(sessions).where(eq(sessions.userId, id));

    await auditLog(session.user.id, "revoke_admin_access", "admin_user", {
      targetId: id,
      targetEmail: targetUser.email,
      previousRole: targetUser.role,
    });

    const response = apiSuccess({ revoked: true, success: true });
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/admin/team/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
