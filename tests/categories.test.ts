import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { POST as create } from "@/app/api/v1/admin/categories/route";
import { PUT as update, DELETE as remove } from "@/app/api/v1/admin/categories/[id]/route";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
});

const post = async (body: unknown) => json(await create(jsonRequest("/api/v1/admin/categories", body, owner.headers)));
const req = (id: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost:3000/api/v1/admin/categories/${id}`, {
    method,
    headers: { "content-type": "application/json", ...owner.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const put = async (id: string, body: unknown) => json(await update(req(id, "PUT", body), { params: Promise.resolve({ id }) }));

describe("categories", () => {
  it("refuses a second category with the same address", async () => {
    expect((await post({ name: "Abayas" })).status).toBe(201);
    const dup = await post({ name: "ABAYAS!" });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatch(/already uses the address \/abayas/);
  });

  it("keeps categories one level deep, with no loops", async () => {
    const top = (await post({ name: "Women" })).body.data;
    const sub = (await post({ name: "Abayas", parentId: top.id })).body.data;

    expect((await post({ name: "Black abayas", parentId: sub.id })).status).toBe(422);
    expect((await put(top.id, { parentId: top.id })).body.error).toMatch(/inside itself/);
    expect((await put(top.id, { parentId: sub.id })).status).toBe(422);
  });

  it("moves subcategories up and uncategorises products when a category is deleted", async () => {
    const top = (await post({ name: "Women" })).body.data;
    const sub = (await post({ name: "Abayas", parentId: top.id })).body.data;
    const { product } = await createProduct({ price: 10000 });
    await db.update(products).set({ categoryId: top.id }).where(eq(products.id, product.id));

    const res = await json(await remove(req(top.id, "DELETE"), { params: Promise.resolve({ id: top.id }) }));
    expect(res.body.data).toEqual({ deleted: true, subcategoriesMovedUp: 1, productsUncategorised: 1 });
    expect((await db.select().from(categories).where(eq(categories.id, sub.id)))[0].parentId).toBeNull();
    expect((await db.select().from(products).where(eq(products.id, product.id)))[0].categoryId).toBeNull();
  });
});
