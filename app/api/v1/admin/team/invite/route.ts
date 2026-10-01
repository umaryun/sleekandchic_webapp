import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireSuperAdmin,
  withCors,
  parseBody,
  auditLog,
} from "@/lib/api-utils";
import { sendEmail } from "@/lib/email/send";
import { staffAccessEmail, staffInviteEmail } from "@/lib/email/templates";
import {
  STAFF_INVITE_TTL_HOURS,
  adminAppUrl,
  createPasswordSetupLink,
  usersWithPassword,
} from "@/lib/services/staff";
import { AdminUser, AdminRole } from "@/types";

// No password here: the new staff member chooses their own from the emailed
// link, and an existing customer keeps the password they already have.
const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase().trim()),
  role: z.enum(["admin", "super_admin"]).default("admin"),
});

interface InviteResult extends AdminUser {
  invitation: {
    emailSent: boolean;
    /** Returned only when the email couldn't be sent, so the owner can pass it on. */
    setupLink: string | null;
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin(req);
    const { data, error } = await parseBody(req, inviteSchema);
    if (error) return error;
    const { name, email, role } = data!;

    const adminUrl = adminAppUrl();
    if (!adminUrl) {
      return withCors(apiError("Set ADMIN_APP_URL to the admin console's address before inviting staff", 503), req);
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser && (existingUser.role === "admin" || existingUser.role === "super_admin")) {
      return withCors(apiError("This person is already on the team", 409), req);
    }

    let member: typeof users.$inferSelect;
    if (existingUser) {
      // An existing customer: give them access, keep their name and password.
      [member] = await db
        .update(users)
        .set({ role: role as AdminRole, banned: false, banReason: null, banExpires: null, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();
    } else {
      [member] = await db
        .insert(users)
        .values({ id: crypto.randomUUID(), name, email, role: role as AdminRole, emailVerified: true, banned: false })
        .returning();
    }

    const hasPassword = (await usersWithPassword([member.id])).has(member.id);
    const setupLink = hasPassword ? null : await createPasswordSetupLink(member.id);
    const emailSent = await sendEmail(
      setupLink
        ? staffInviteEmail(member.email, member.name, role, setupLink, STAFF_INVITE_TTL_HOURS)
        : staffAccessEmail(member.email, member.name, role, adminUrl)
    );

    await auditLog(session.user.id, existingUser ? "promote_admin" : "invite_admin", "admin_user", {
      targetId: member.id,
      email,
      role,
      emailSent,
    });

    const result: InviteResult = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role as AdminRole,
      status: hasPassword ? "active" : "invited",
      avatarUrl: member.image || null,
      createdAt: (member.createdAt ?? new Date()).toISOString(),
      lastLoginAt: null,
      invitation: { emailSent, setupLink: emailSent ? null : setupLink },
    };
    return withCors(apiSuccess(result, existingUser ? 200 : 201), req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/team/invite error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
