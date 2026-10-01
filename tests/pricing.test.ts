import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest } from "./support/fixtures";
import { GET as list } from "@/app/api/v1/store/products/route";
import { saleInfo } from "@/lib/pricing";

beforeEach(resetTestDb);

const shop = async (query: string) =>
  (await json(await list(jsonRequest(`/api/v1/store/products${query}`)))).body.data.products as Array<{
    name: string;
    badge: string | null;
    discount: number | null;
    originalPrice: number | null;
  }>;

describe("sale prices", () => {
  it("work out the percentage from the prices", () => {
    expect(saleInfo(15000, 20000)).toEqual({ onSale: true, originalPrice: 20000, discountPercent: 25 });
    expect(saleInfo(20000, 15000)).toEqual({ onSale: false, originalPrice: null, discountPercent: null });
    expect(saleInfo(20000, null).onSale).toBe(false);
  });

  it("can't contradict the badge or percentage typed in by hand", async () => {
    const { product: real } = await createProduct({ name: "Real sale", price: 15000 });
    await db.update(products).set({ originalPrice: "20000.00", badge: "new", discount: 70 }).where(eq(products.id, real.id));
    const { product: fake } = await createProduct({ name: "Says sale", price: 15000 });
    await db.update(products).set({ badge: "sale", discount: 50 }).where(eq(products.id, fake.id));

    const all = Object.fromEntries((await shop("")).map((p) => [p.name, p]));
    expect(all["Real sale"]).toMatchObject({ badge: "sale", discount: 25, originalPrice: 20000 });
    expect(all["Says sale"]).toMatchObject({ badge: null, discount: null, originalPrice: null });

    expect((await shop("?badge=sale")).map((p) => p.name)).toEqual(["Real sale"]);
  });

  it("lists featured products on request", async () => {
    const { product } = await createProduct({ name: "Picked", price: 10000 });
    await createProduct({ name: "Not picked", price: 10000 });
    await db.update(products).set({ isFeatured: true }).where(eq(products.id, product.id));
    expect((await shop("?featured=1")).map((p) => p.name)).toEqual(["Picked"]);
  });
});
