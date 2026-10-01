// One-off, for a database that was set up with `db:push` before migrations
// existed: records every migration in ./drizzle as already applied, so
// `db:migrate` only runs migrations added after this point.
//
//   1. npm run db:push      (bring the live schema up to this code)
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
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string; when: number }[];
  };
  // Same hashes drizzle's migrator records.
  const applied = journal.entries.map((entry) => ({
    hash: crypto.createHash("sha256").update(fs.readFileSync(`drizzle/${entry.tag}.sql`).toString()).digest("hex"),
    createdAt: entry.when,
    tag: entry.tag,
  }));

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

    for (const m of applied) {
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${m.hash}, ${m.createdAt})`;
    }
    console.log(`Recorded ${applied.map((m) => m.tag).join(", ")} as applied. Use \`npm run db:migrate\` from now on.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
