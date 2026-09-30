import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "../../lib/db/schema";

// In-memory Postgres standing in for lib/db in tests (see vitest.config.ts).
const client = new PGlite();
export const db = drizzle(client, { schema });

let ready: Promise<void> | null = null;

/** Creates every table from lib/db/schema.ts. Safe to call more than once. */
export function migrateTestDb() {
  ready ??= (async () => {
    const { generateDrizzleJson, generateMigration } = await import("drizzle-kit/api");
    const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));
    for (const statement of statements) await db.execute(sql.raw(statement));
  })();
  return ready;
}

/** Empties every table between tests. */
export async function resetTestDb() {
  await migrateTestDb();
  const tables = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`
  );
  const names = tables.rows.map((r) => `"${r.tablename}"`).join(", ");
  if (names) await db.execute(sql.raw(`TRUNCATE ${names} RESTART IDENTITY CASCADE`));
}
