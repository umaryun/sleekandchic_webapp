import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { db } from "@/lib/db";
import { env, adminAppOrigins } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { normalizeNigerianPhone } from "@/lib/phone";
import * as schema from "@/lib/db/schema";

// The admin plugin is kept only for its ban enforcement at sign-in. Team and role
// management go through /api/v1/admin/team, so no role may use the plugin's own
// /api/auth/admin/* endpoints (set-role, impersonate-user, set-user-password, ...).
const ac = createAccessControl(defaultStatements);
const noPluginAccess = ac.newRole({ user: [], session: [] });
const roles = {
  customer: noPluginAccess,
  admin: noPluginAccess,
  super_admin: noPluginAccess,
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      rateLimit: schema.authRateLimits,
    },
  }),

  // On in production (better-auth's default), with stricter built-in limits for
  // sign-in, sign-up and password resets. Counted in the database so every
  // server instance shares them.
  rateLimit: {
    storage: "database",
  },

  // The secret comes from BETTER_AUTH_SECRET; better-auth refuses to start in
  // production without one.
  baseURL: env.BETTER_AUTH_URL,

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(passwordResetEmail(user.email, user.name, url));
    },
    // A reset signs the account out everywhere else.
    revokeSessionsOnPasswordReset: true,
  },

  // Custom user fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  // Plugins
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "customer",
      adminRoles: ["super_admin"],
    }),

    // Bearer token auth for external Admin app
    bearer(),
  ],

  // Phone numbers given at sign-up are stored in +234 form, or not at all.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const raw = (user as { phone?: unknown }).phone;
          return { data: { ...user, phone: typeof raw === "string" ? normalizeNigerianPhone(raw) : null } };
        },
      },
    },
  },

  // The admin console signs in cross-origin.
  trustedOrigins: adminAppOrigins,
});

// Export auth types
export type Session = typeof auth.$Infer.Session;
