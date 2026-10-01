import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages, products } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct } from "./support/fixtures";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { generateMetadata as productMetadata } from "@/app/products/[slug]/page";

beforeEach(resetTestDb);

describe("search and share previews", () => {
  it("lists products on sale in the sitemap, not archived ones", async () => {
    const { product: live } = await createProduct({ name: "Silk Bubu", price: 25000 });
    const { product: gone } = await createProduct({ name: "Old Abaya", price: 15000 });
    await db.update(products).set({ status: "archived" }).where(eq(products.id, gone.id));

    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`http://localhost:3000/products/${live.slug}`);
    expect(urls).not.toContain(`http://localhost:3000/products/${gone.slug}`);
    expect(urls).toContain("http://localhost:3000/returns");
  });

  it("keeps private pages out of search", () => {
    const rules = robots().rules as { disallow: string[] };
    expect(rules.disallow).toEqual(expect.arrayContaining(["/checkout", "/profile", "/api/"]));
  });

  it("gives each product its own title, description and photo for link previews", async () => {
    const { product } = await createProduct({ name: "Emerald Kaftan", price: 30000 });
    await db.update(products).set({ description: "Flowing   chiffon\nkaftan with gold trim." }).where(eq(products.id, product.id));
    await db.insert(productImages).values({ productId: product.id, imageUrl: "https://cdn.test/kaftan.jpg", displayOrder: 0 });

    const meta = await productMetadata({ params: Promise.resolve({ slug: product.slug }) });
    expect(meta.title).toBe("Emerald Kaftan | Sleekandchic");
    expect(meta.description).toBe("Flowing chiffon kaftan with gold trim.");
    expect(meta.openGraph?.images).toEqual([{ url: "https://cdn.test/kaftan.jpg", alt: "Emerald Kaftan" }]);

    const missing = await productMetadata({ params: Promise.resolve({ slug: "nope" }) });
    expect(missing.robots).toEqual({ index: false });
  });
});
