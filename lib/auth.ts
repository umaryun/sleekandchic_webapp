import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  // Base URL for auth endpoints
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "default_development_secret_min_32_chars_long",

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
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
      isAnonymous: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },

  // Plugins
  plugins: [
    // Admin management (user CRUD, ban, impersonate)
    admin({
      defaultRole: "customer",
      adminRole: ["admin", "super_admin"],
    }),

    // Bearer token auth for external Admin app
    bearer(),

    // Anonymous / guest users
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Merge guest cart into authenticated user's cart
        try {
          // Find guest cart
          const guestCarts = await db
            .select()
            .from(schema.carts)
            .where(eq(schema.carts.userId, anonymousUser.user.id));

          if (guestCarts.length === 0) return;

          const guestCart = guestCarts[0];

          // Find or create authenticated user's cart
          let userCarts = await db
            .select()
            .from(schema.carts)
            .where(eq(schema.carts.userId, newUser.user.id));

          let userCart;
          if (userCarts.length === 0) {
            const [created] = await db
              .insert(schema.carts)
              .values({ userId: newUser.user.id })
              .returning();
            userCart = created;
          } else {
            userCart = userCarts[0];
          }

          // Get guest cart items
          const guestItems = await db
            .select()
            .from(schema.cartItems)
            .where(eq(schema.cartItems.cartId, guestCart.id));

          // Move items to user cart (or merge quantities)
          for (const item of guestItems) {
            const existingItems = await db
              .select()
              .from(schema.cartItems)
              .where(eq(schema.cartItems.cartId, userCart.id));

            const existing = existingItems.find(
              (i) =>
                i.productId === item.productId &&
                i.variantId === item.variantId
            );

            if (existing) {
              await db
                .update(schema.cartItems)
                .set({ quantity: existing.quantity + item.quantity })
                .where(eq(schema.cartItems.id, existing.id));
            } else {
              await db.insert(schema.cartItems).values({
                cartId: userCart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              });
            }
          }

          // Delete guest cart (cascade deletes items)
          await db
            .delete(schema.carts)
            .where(eq(schema.carts.id, guestCart.id));
        } catch (error) {
          console.error("Cart merge failed:", error);
        }
      },
    }),
  ],

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.ADMIN_APP_URL || "http://localhost:3001",
  ],
});

// Export auth types
export type Session = typeof auth.$Infer.Session;
