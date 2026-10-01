import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { migrationUrl } from "./lib/db/migration-url";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Only read by commands that connect (migrate, push, studio), not generate.
    get url() {
      return migrationUrl();
    },
  },
});
