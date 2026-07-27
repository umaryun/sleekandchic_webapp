import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });
dotenv.config();

const getMigrationUrl = () => {
  const direct = process.env.DATABASE_URL_DIRECT;
  if (direct && !direct.includes("db.") && !direct.includes("placeholder")) {
    return direct;
  }
  const pooler = process.env.DATABASE_URL || "";
  return pooler.replace(":6543/", ":5432/");
};

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationUrl(),
  },
});
