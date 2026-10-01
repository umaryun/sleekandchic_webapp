import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, productVariants, stockMovements, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { PUT as updateProduct } from "@/app/api/v1/admin/products/[id]/route";
import { POST as createProductRoute } from "@/app/api/v1/admin/products/route";
import { POST as cartPost, GET as cartGet } from "@/app/api/v1/store/cart/route";

let adminHeaders: Record<string, string>;

beforeEach(async () => {
  await resetTestDb();
  const admin = await signUpCustomer("staff@example.com");
  await db.update(users).set({ role: "admin" }).where(eq(users.id, admin.userId));
  adminHeaders = admin.headers;
});

const put = (productId: string, body: unknown) =>
  updateProduct(
    new NextRequest(`http://localhost:3000/api/v1/admin/products/${productId}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...adminHeaders },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: productId }) }
  );

const variantsOf = (productId: string) =>
  db.select().from(productVariants).where(eq(productVariants.productId, productId));

describe("editing a product's sizes", () => {
  it("keeps variant ids when the editor resends them, with or without ids", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", color: "Black", stock: 5 }, { size: "L", color: "Black", stock: 3 }] });
    const before = (await variantsOf(product.id)).map((v) => v.id).sort();

    // With ids
    expect((await put(product.id, { variants: variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stockQuantity: v.stockQuantity })) })).status).toBe(200);
    // Without ids (matched by size and colour)
    expect((await put(product.id, { variants: [{ size: "M", color: "Black", stockQuantity: 5 }, { size: "L", color: "black", stockQuantity: 3 }] })).status).toBe(200);

    expect((await variantsOf(product.id)).map((v) => v.id).sort()).toEqual(before);
  });

  it("keeps a bag's chosen size after the product is edited", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
    const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id })));
    await put(product.id, { price: 21000, variants: [{ size: "M", color: "Black", stockQuantity: 5 }] });
    const bag = await json(await cartGet(jsonRequest("/api/v1/store/cart", undefined, { "x-guest-token": added.body.data.guestToken })));
    expect(bag.body.data.items[0]).toMatchObject({ variantId: variants[0].id, size: "M", unitPrice: 21000, problem: null });
  });

  it("records stock edits as adjustments", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
    await put(product.id, { variants: [{ id: variants[0].id, size: "M", color: "Black", stockQuantity: 12 }] });
    const moves = await db.select().from(stockMovements).where(eq(stockMovements.variantId, variants[0].id));
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ delta: 7, reason: "adjustment" });
  });

  it("archives a removed size that orders refer to, and deletes one nothing uses", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }, { size: "L", stock: 5 }, { size: "XL", stock: 5 }] });
    const [medium, large] = variants;
    const [order] = await db.insert(orders).values({ orderNumber: "SC-OLD-0001", totalAmount: "20000.00" }).returning();
    await db.insert(orderItems).values({ orderId: order.id, productId: product.id, variantId: medium.id, name: "x", price: "20000.00", quantity: 1, size: "M" });

    await put(product.id, { variants: [{ id: large.id, size: "L", color: "Black", stockQuantity: 5 }] });

    const rows = await variantsOf(product.id);
    expect(rows.find((v) => v.id === medium.id)?.isActive).toBe(false);
    expect(rows.find((v) => v.id === large.id)?.isActive).toBe(true);
    expect(rows.some((v) => v.size === "XL")).toBe(false);
  });

  it("flags a bag line whose size was removed", async () => {
    const { product, variants } = await createProduct({ name: "Emerald Abaya", price: 20000, variants: [{ size: "M", stock: 5 }, { size: "L", stock: 5 }] });
    const added = await json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId: product.id, variantId: variants[0].id })));
    await put(product.id, { variants: [{ id: variants[1].id, size: "L", color: "Black", stockQuantity: 5 }] });
    const bag = await json(await cartGet(jsonRequest("/api/v1/store/cart", undefined, { "x-guest-token": added.body.data.guestToken })));
    expect(bag.body.data.items[0].problem).toMatch(/Emerald Abaya \(Black, M\) is no longer available/);
  });

  it("rejects the same size and colour twice", async () => {
    const { product } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
    const res = await json(await put(product.id, { variants: [{ size: "M", color: "Black", stockQuantity: 1 }, { size: "m", color: "black", stockQuantity: 2 }] }));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Repeated: black \/ m|Repeated: Black \/ M|Repeated/);
  });

  it("records opening stock when a product is created", async () => {
    const res = await json(
      await createProductRoute(
        jsonRequest("/api/v1/admin/products", { name: "Silk Bubu", price: 25000, variants: [{ size: "M", color: "Gold", stockQuantity: 4 }] }, adminHeaders)
      )
    );
    expect(res.status).toBe(201);
    const moves = await db.select().from(stockMovements);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ delta: 4, reason: "adjustment" });
  });
});

describe("variant colours", () => {
  it("refuses hex codes, which customers would see as-is", async () => {
    const { product } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
    const res = await json(await put(product.id, { variants: [{ size: "M", color: "#000000", stockQuantity: 5 }] }));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/colour name/);
    expect((await put(product.id, { variants: [{ size: "M", color: " Emerald ", stockQuantity: 5 }] })).status).toBe(200);
    expect((await variantsOf(product.id))[0].color).toBe("Emerald");
  });
});
