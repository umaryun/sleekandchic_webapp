// Applies new migrations from ./drizzle. Run on every deploy: npm run db:migrate
import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { migrationUrl } from "./migration-url";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const client = postgres(migrationUrl(), { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("Database is up to date.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
