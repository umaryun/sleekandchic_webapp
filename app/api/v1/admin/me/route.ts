import { NextRequest } from "next/server";
import { apiSuccess, apiError, requireAdmin, withCors, type AuthenticatedUser } from "@/lib/api-utils";
import type { AdminRole, AdminUser } from "@/types";

/** The signed-in staff member. Customers get 403, so the admin console can refuse them at sign-in. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const user = session.user as AuthenticatedUser & { createdAt: Date };
    const me: AdminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as AdminRole,
      status: "active",
      avatarUrl: user.image ?? null,
      createdAt: new Date(user.createdAt).toISOString(),
      lastLoginAt: new Date(session.session.createdAt).toISOString(),
    };
    return withCors(apiSuccess(me), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/me error:", err);
    return apiError("Internal server error", 500);
  }
}
