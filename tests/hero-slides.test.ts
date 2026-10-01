import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { POST as createSlide } from "@/app/api/v1/admin/hero-slides/route";
import { isSafeHref } from "@/lib/links";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
});

const create = async (body: Record<string, unknown>) =>
  json(await createSlide(jsonRequest("/api/v1/admin/hero-slides", { imageUrl: "https://cdn.test/a.jpg", ...body }, owner.headers)));

describe("hero slide links", () => {
  it("accepts pages on the site and https links only", () => {
    expect(isSafeHref("/products?sale=true")).toBe(true);
    expect(isSafeHref("https://instagram.com/sleekandchic")).toBe(true);
    for (const bad of ["javascript:alert(1)", "//evil.example", "http://plain.example", "products", ""]) {
      expect(isSafeHref(bad)).toBe(false);
    }
  });

  it("refuses an unsafe link and keeps text tidy", async () => {
    const bad = await create({ href: "javascript:alert(1)" });
    expect(bad.status).toBe(422);

    const ok = await create({ boldText: "  Eid edit  ", regularText: "", href: "/products?category=abayas", linkText: "Shop abayas" });
    expect(ok.status).toBe(201);
    expect(ok.body.data).toMatchObject({ boldText: "Eid edit", regularText: null, href: "/products?category=abayas", isActive: true, displayOrder: 0 });
  });
});
