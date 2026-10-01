// Gives an existing account full (owner) access to the admin console:
//   npm run db:make-owner -- owner@example.com
// The person signs up on the shop first; this only changes their role.
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run db:make-owner -- owner@example.com");
    process.exit(1);
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`No account for ${email}. Sign up on the shop with that email first.`);
    process.exit(1);
  }
  if (user.role === "super_admin") {
    console.log(`${email} is already an owner.`);
    return;
  }
  await db.update(users).set({ role: "super_admin", banned: false, updatedAt: new Date() }).where(eq(users.id, user.id));
  console.log(`${email} is now an owner and can sign in to the admin console.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
