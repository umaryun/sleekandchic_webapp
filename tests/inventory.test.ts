import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, stockMovements, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest, signUpCustomer, stockOf } from "./support/fixtures";
import { GET as listInventory } from "@/app/api/v1/admin/inventory/route";
import { POST as adjust } from "@/app/api/v1/admin/inventory/adjust/route";
import { GET as movements } from "@/app/api/v1/admin/inventory/movements/route";
import { GET as listProducts } from "@/app/api/v1/admin/products/route";
import { POST as bulkProducts } from "@/app/api/v1/admin/products/bulk/route";
import { POST as duplicate } from "@/app/api/v1/admin/products/[id]/duplicate/route";

let staff: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  staff = await signUpCustomer("staff@example.com");
  await db.update(users).set({ role: "admin" }).where(eq(users.id, staff.userId));
});

const get = async (handler: (req: never) => Promise<Response>, url: string) =>
  json(await handler(jsonRequest(url, undefined, staff.headers) as never));

describe("inventory", () => {
  it("lists sizes emptiest first and filters low and sold out", async () => {
    await createProduct({ name: "Abaya", price: 20000, variants: [{ size: "S", stock: 0 }, { size: "M", stock: 3 }, { size: "L", stock: 12 }] });
    const all = await get(listInventory, "/api/v1/admin/inventory");
    expect(all.body.data.items.map((i: { size: string }) => i.size)).toEqual(["S", "M", "L"]);
    expect(all.body.data.summary).toMatchObject({ units: 15, out: 1, low: 1, sizes: 3, value: 300000 });

    const low = await get(listInventory, "/api/v1/admin/inventory?stock=low");
    expect(low.body.data.items.map((i: { size: string }) => i.size)).toEqual(["M"]);
    const out = await get(listInventory, "/api/v1/admin/inventory?stock=out");
    expect(out.body.data.items.map((i: { size: string }) => i.size)).toEqual(["S"]);
  });

  it("adds, removes and sets stock with a reason, kept in the history", async () => {
    const { variants } = await createProduct({ price: 20000, variants: [{ stock: 4 }] });
    const id = variants[0].id;
    const send = (body: object) => adjust(jsonRequest("/api/v1/admin/inventory/adjust", { variantId: id, ...body }, staff.headers));

    expect((await json(await send({ mode: "add", quantity: 6, reason: "restock", note: "From Kano market" }))).body.data).toEqual({ stock: 10, previous: 4 });
    expect((await json(await send({ mode: "remove", quantity: 1, reason: "damaged" }))).body.data.stock).toBe(9);
    expect((await json(await send({ mode: "set", quantity: 7, reason: "adjustment" }))).body.data.stock).toBe(7);
    expect(await stockOf(id)).toBe(7);

    const history = await get(movements, `/api/v1/admin/inventory/movements?variantId=${id}`);
    expect(history.body.data.movements.map((m: { delta: number; reason: string }) => [m.reason, m.delta])).toEqual([
      ["adjustment", -2],
      ["damaged", -1],
      ["restock", 6],
    ]);
    expect(history.body.data.movements[2]).toMatchObject({ note: "From Kano market", actorName: "Aisha Bello" });
  });

  it("won't remove more than there is", async () => {
    const { variants } = await createProduct({ price: 20000, variants: [{ stock: 2 }] });
    const res = await json(await adjust(jsonRequest("/api/v1/admin/inventory/adjust", { variantId: variants[0].id, mode: "remove", quantity: 3, reason: "damaged" }, staff.headers)));
    expect(res.status).toBe(409);
    expect(await db.select().from(stockMovements)).toHaveLength(0);
  });
});

describe("products list and bulk changes", () => {
  it("filters by stock and shows each product's total", async () => {
    await createProduct({ name: "Sold Out Gown", price: 20000, variants: [{ stock: 0 }] });
    await createProduct({ name: "Plenty Bubu", price: 20000, variants: [{ stock: 30 }] });
    await createProduct({ name: "Scarf", price: 5000 });
    const out = await get(listProducts, "/api/v1/admin/products?stock=out");
    expect(out.body.data.products.map((p: { name: string }) => p.name)).toEqual(["Sold Out Gown"]);
    const untracked = await get(listProducts, "/api/v1/admin/products?stock=untracked");
    expect(untracked.body.data.products[0]).toMatchObject({ name: "Scarf", totalStock: null, variantCount: 0 });
    const plenty = await get(listProducts, "/api/v1/admin/products?search=plenty");
    expect(plenty.body.data.products[0]).toMatchObject({ totalStock: 30, variantCount: 1 });
  });

  it("drafts, features and archives several at once; archiving is owner-only", async () => {
    const a = await createProduct({ price: 1000 });
    const b = await createProduct({ price: 1000 });
    const ids = [a.product.id, b.product.id];
    const send = (action: string) => bulkProducts(jsonRequest("/api/v1/admin/products/bulk", { productIds: ids, action }, staff.headers));

    expect((await json(await send("draft"))).body.data.updated).toBe(2);
    expect((await json(await send("feature"))).body.data.updated).toBe(2);
    const rows = await db.select().from(products);
    expect(rows.every((p) => p.status === "draft" && p.isFeatured)).toBe(true);
    expect((await send("archive")).status).toBe(403);
  });

  it("duplicates a product as a draft with its sizes and no stock", async () => {
    const { product } = await createProduct({ name: "Navy Abaya", price: 25000, variants: [{ size: "M", stock: 4 }, { size: "L", stock: 2 }] });
    const res = await json(await duplicate(jsonRequest(`/api/v1/admin/products/${product.id}/duplicate`, {}, staff.headers), { params: Promise.resolve({ id: product.id }) }));
    expect(res.status).toBe(201);
    const copy = await get(listProducts, "/api/v1/admin/products?search=copy");
    expect(copy.body.data.products[0]).toMatchObject({ name: "Navy Abaya (copy)", status: "draft", variantCount: 2, totalStock: 0 });
  });
});
