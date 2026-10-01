// One-off, for a database that was set up with `db:push` before migrations
// existed: records drizzle/0000_baseline.sql as already applied, so
// `db:migrate` starts from there instead of trying to create existing tables.
//
//   1. npm run db:push      (bring the live schema up to this baseline)
//   2. npm run db:baseline  (record it; safe to run twice)
//   3. npm run db:migrate   (from now on, on every deploy)
import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import postgres from "postgres";
import { migrationUrl } from "./migration-url";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
  const baseline = journal.entries[0];
  if (baseline?.tag !== "0000_baseline") throw new Error("drizzle/0000_baseline.sql isn't the first migration");
  // Same hash drizzle's migrator records.
  const hash = crypto.createHash("sha256").update(fs.readFileSync(`drizzle/${baseline.tag}.sql`).toString()).digest("hex");

  const sql = postgres(migrationUrl(), { max: 1 });
  try {
    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;

    const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
    if (count > 0) {
      console.log("Migration history already exists; nothing to do.");
      return;
    }
    const [{ exists }] = await sql`select to_regclass('public.orders') is not null as exists`;
    if (!exists) {
      console.log("This database is empty. Run `npm run db:migrate` to create it instead.");
      return;
    }

    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${baseline.when})`;
    console.log("Recorded the baseline as applied. Use `npm run db:migrate` from now on.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
