/**
 * Connection string for schema changes. Migrations need a direct (session)
 * connection: DATABASE_URL_DIRECT when set, otherwise DATABASE_URL moved from
 * the transaction pooler port (6543) to the direct port (5432).
 */
export function migrationUrl(): string {
  const direct = process.env.DATABASE_URL_DIRECT;
  if (direct && !direct.includes("db.") && !direct.includes("placeholder")) return direct;
  const pooled = process.env.DATABASE_URL;
  if (!pooled) throw new Error("Set DATABASE_URL (or DATABASE_URL_DIRECT) to run migrations");
  return pooled.replace(":6543/", ":5432/");
}
