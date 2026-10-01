import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { ADDRESS, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { GET as listCustomers } from "@/app/api/v1/admin/customers/route";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
});

let n = 0;
const order = (values: Partial<typeof orders.$inferInsert>) =>
  db.insert(orders).values({ orderNumber: `SC-C-${++n}`, totalAmount: "10000.00", shippingAddress: ADDRESS, ...values });

const list = async (query = "") =>
  (await json(await listCustomers(jsonRequest(`/api/v1/admin/customers${query}`, undefined, owner.headers)))).body.data;

describe("customers list", () => {
  it("lists accounts and guests, leaves staff out, and counts paid spend only", async () => {
    const aisha = await signUpCustomer("aisha@example.com");
    await order({ userId: aisha.userId, paymentStatus: "paid", status: "delivered" });
    await order({ userId: aisha.userId, paymentStatus: "unpaid", status: "pending" });
    // Guest checkout with Aisha's email belongs to her account.
    await order({ guestEmail: "AISHA@example.com", paymentStatus: "paid", totalAmount: "5000.00" });
    // A guest who never registered.
    await order({ guestEmail: "musa@example.com", paymentStatus: "paid", shippingAddress: { ...ADDRESS, firstName: "Musa", lastName: "Ibrahim", phone: "0705 111 2222" } });
    await order({ guestEmail: "musa@example.com", status: "cancelled" });
    // The owner's own test order.
    await order({ userId: owner.userId, paymentStatus: "paid" });

    const { customers, pagination } = await list();
    expect(pagination.total).toBe(2);
    const byEmail = Object.fromEntries(customers.map((c: { email: string }) => [c.email, c]));
    expect(byEmail["aisha@example.com"]).toMatchObject({ type: "account", totalOrders: 3, totalSpent: 15000, name: "Aisha Bello" });
    expect(byEmail["musa@example.com"]).toMatchObject({ type: "guest", userId: null, totalOrders: 1, totalSpent: 10000, name: "Musa Ibrahim", phone: "0705 111 2222" });
    expect(byEmail["owner@example.com"]).toBeUndefined();
  });

  it("finds people by name, email or phone in any format", async () => {
    await order({ guestEmail: "musa@example.com", shippingAddress: { ...ADDRESS, firstName: "Musa", lastName: "Ibrahim", phone: "0705 111 2222" } });
    await signUpCustomer("zainab@example.com");
    expect((await list("?search=musa")).customers).toHaveLength(1);
    expect((await list("?search=07051112222")).customers[0].email).toBe("musa@example.com");
    expect((await list("?search=zainab@")).customers[0].type).toBe("account");
    expect((await list("?search=100%25")).customers).toHaveLength(0);
  });
});
