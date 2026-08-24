import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { hashPassword } from "better-auth/crypto";
import { AdminUser, AdminRole } from "@/types";

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase().trim()),
  role: z.enum(["admin", "super_admin"]).default("admin"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin(req);
    const { data, error } = await parseBody(req, inviteSchema);
    if (error) return error;

    const { name, email, role, password } = data!;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      if (existingUser.role === "admin" || existingUser.role === "super_admin") {
        return apiError("An administrator with this email already exists", 409);
      }

      // Promote existing customer to admin/super_admin
      const [updatedUser] = await db
        .update(users)
        .set({
          name,
          role: role as AdminRole,
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      // If password provided, update/insert credential account
      if (password) {
        const hashedPassword = await hashPassword(password);
        const [existingAccount] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, existingUser.id))
          .limit(1);

        if (existingAccount) {
          await db
            .update(accounts)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(accounts.id, existingAccount.id));
        } else {
          await db.insert(accounts).values({
            id: crypto.randomUUID(),
            accountId: existingUser.id,
            providerId: "credential",
            userId: existingUser.id,
            password: hashedPassword,
          });
        }
      }

      await auditLog(session.user.id, "promote_admin", "admin_user", {
        targetId: existingUser.id,
        email,
        role,
        name,
      });

      const adminUser: AdminUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role as AdminRole,
        status: updatedUser.banned ? "suspended" : "active",
        avatarUrl: updatedUser.image || null,
        createdAt: updatedUser.createdAt ? new Date(updatedUser.createdAt).toISOString() : new Date().toISOString(),
        lastLoginAt: null,
      };

      const response = apiSuccess(adminUser, 200);
      return withCors(response, req);
    }

    // Create new admin user
    const userId = crypto.randomUUID();

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        role: role as AdminRole,
        emailVerified: true,
        banned: false,
      })
      .returning();

    // If password provided, create credential account
    if (password) {
      const hashedPassword = await hashPassword(password);
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      });
    }

    await auditLog(session.user.id, "invite_admin", "admin_user", {
      targetId: userId,
      email,
      role,
      name,
    });

    const createdAdmin: AdminUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as AdminRole,
      status: "active",
      avatarUrl: newUser.image || null,
      createdAt: newUser.createdAt ? new Date(newUser.createdAt).toISOString() : new Date().toISOString(),
      lastLoginAt: null,
    };

    const response = apiSuccess(createdAdmin, 201);
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/team/invite error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
