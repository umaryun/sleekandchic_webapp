import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createProduct, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { POST as cartPost, GET as cartGet } from "@/app/api/v1/store/cart/route";
import { POST as merge } from "@/app/api/v1/store/cart/merge/route";

beforeEach(resetTestDb);

const add = async (productId: string, variantId: string, quantity: number, headers: Record<string, string> = {}) =>
  json(await cartPost(jsonRequest("/api/v1/store/cart", { action: "add", productId, variantId, quantity }, headers)));

describe("merging the guest bag at sign-in", () => {
  it("hands the guest bag over when the customer has none", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 5 }] });
    const guest = await add(product.id, variants[0].id, 2);
    const guestCartId = (await db.select().from(carts))[0].id;
    const customer = await signUpCustomer();

    const res = await json(await merge(jsonRequest("/api/v1/store/cart/merge", { guestToken: guest.body.data.guestToken }, customer.headers)));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);

    // Same cart row, so orders pointing at it still find it.
    const [cart] = await db.select().from(carts);
    expect(cart).toMatchObject({ id: guestCartId, userId: customer.userId, guestSessionToken: null });
  });

  it("combines with the customer's own bag, up to the per-item limit", async () => {
    const { product, variants } = await createProduct({ price: 20000, variants: [{ size: "M", stock: 50 }, { size: "L", stock: 50 }] });
    const customer = await signUpCustomer();
    await add(product.id, variants[0].id, 15, customer.headers);
    const guest = await add(product.id, variants[0].id, 10);
    await add(product.id, variants[1].id, 1, { "x-guest-token": guest.body.data.guestToken });

    const res = await json(await merge(jsonRequest("/api/v1/store/cart/merge", { guestToken: guest.body.data.guestToken }, customer.headers)));
    const bySize = Object.fromEntries(res.body.data.items.map((i: { size: string; quantity: number }) => [i.size, i.quantity]));
    expect(bySize).toEqual({ M: 20, L: 1 });

    // The guest bag is gone; merging again changes nothing.
    expect(await db.select().from(carts).where(eq(carts.guestSessionToken, guest.body.data.guestToken))).toHaveLength(0);
    const again = await json(await merge(jsonRequest("/api/v1/store/cart/merge", { guestToken: guest.body.data.guestToken }, customer.headers)));
    expect(again.body.data.items).toHaveLength(2);

    const bag = await json(await cartGet(jsonRequest("/api/v1/store/cart", undefined, customer.headers)));
    expect(bag.body.data.items).toHaveLength(2);
  });

  it("needs a signed-in customer", async () => {
    const res = await merge(jsonRequest("/api/v1/store/cart/merge", { guestToken: "abc" }));
    expect(res.status).toBe(401);
  });
});
