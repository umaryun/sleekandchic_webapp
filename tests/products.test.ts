import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest } from "./support/fixtures";
import { GET as listProducts } from "@/app/api/v1/store/products/route";

const list = async (query: Record<string, string>) =>
  json(await listProducts(jsonRequest(`/api/v1/store/products?${new URLSearchParams(query)}`)));
const names = (res: { body: { data: { products: { name: string }[] } } }) =>
  res.body.data.products.map((p) => p.name).sort();

beforeEach(async () => {
  await resetTestDb();
  const [abayas] = await db.insert(categories).values({ name: "Abayas", slug: "abayas" }).returning();
  const emerald = await createProduct({ name: "Emerald Abaya", price: 30000, variants: [{ stock: 2 }] });
  await db.update(products).set({ categoryId: abayas.id }).where(eq(products.id, emerald.product.id));
  const silk = await createProduct({ name: "Silk Bubu", price: 25000, variants: [{ stock: 0, size: "M" }, { stock: 0, size: "L" }] });
  await db.update(products).set({ description: "Flowing 50% silk blend" }).where(eq(products.id, silk.product.id));
  await createProduct({ name: "Plain Kaftan", price: 18000 });
});

describe("product listing", () => {
  it("searches names, descriptions and category names", async () => {
    expect(names(await list({ search: "emerald" }))).toEqual(["Emerald Abaya"]);
    expect(names(await list({ search: "silk blend" }))).toEqual(["Silk Bubu"]);
    expect(names(await list({ search: "abayas" }))).toEqual(["Emerald Abaya"]);
  });

  it("treats % and _ in a search as plain text", async () => {
    expect(names(await list({ search: "50%" }))).toEqual(["Silk Bubu"]);
    expect(names(await list({ search: "%" }))).toEqual(["Silk Bubu"]);
    expect((await list({ search: "_" })).body.data.products).toHaveLength(0);
  });

  it("returns nothing for an unknown category instead of everything", async () => {
    const res = await list({ category: "no-such-category" });
    expect(res.body.data.products).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("tells cards whether they can add directly", async () => {
    const res = await list({});
    const byName = Object.fromEntries(res.body.data.products.map((p: { name: string }) => [p.name, p]));
    expect(byName["Emerald Abaya"]).toMatchObject({ soldOut: false, hasOptions: false });
    expect(byName["Emerald Abaya"].singleVariantId).toBeTruthy();
    expect(byName["Silk Bubu"]).toMatchObject({ soldOut: true, hasOptions: true, singleVariantId: null });
    expect(byName["Plain Kaftan"]).toMatchObject({ soldOut: false, hasOptions: false, singleVariantId: null });
  });
});
