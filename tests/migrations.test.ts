import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@/lib/db/schema";

const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
const latest = journal.entries.at(-1);

describe("migrations", () => {
  it("cover every change in lib/db/schema.ts (run `npm run db:generate` if this fails)", async () => {
    const { generateDrizzleJson, generateMigration } = await import("drizzle-kit/api");
    const snapshot = JSON.parse(fs.readFileSync(`drizzle/meta/${String(latest.idx).padStart(4, "0")}_snapshot.json`, "utf8"));
    expect(await generateMigration(snapshot, generateDrizzleJson(schema))).toEqual([]);
  });

  it("build a working database from empty", async () => {
    const pg = new PGlite();
    for (const entry of journal.entries) {
      const file = fs.readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
      for (const statement of file.split("--> statement-breakpoint")) {
        if (statement.trim()) await pg.exec(statement);
      }
    }
    const { rows } = await pg.query<{ n: number }>(
      "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in ('orders', 'order_events', 'rate_limits')"
    );
    expect(rows[0].n).toBe(3);
    await pg.close();
  });
});
