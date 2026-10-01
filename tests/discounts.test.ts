import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { discounts, users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { createDiscount, json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { GET as list, POST as create } from "@/app/api/v1/admin/discounts/route";
import { PUT as update, DELETE as remove } from "@/app/api/v1/admin/discounts/[id]/route";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
});

const post = async (body: unknown) => json(await create(jsonRequest("/api/v1/admin/discounts", body, owner.headers)));
const put = async (id: string, body: unknown) =>
  json(
    await update(
      new NextRequest(`http://localhost:3000/api/v1/admin/discounts/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json", ...owner.headers },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) }
    )
  );
const del = async (id: string) =>
  json(
    await remove(new NextRequest(`http://localhost:3000/api/v1/admin/discounts/${id}`, { method: "DELETE", headers: owner.headers }), {
      params: Promise.resolve({ id }),
    })
  );

describe("managing promo codes", () => {
  it("creates codes in capitals and refuses a duplicate with a clear message", async () => {
    const res = await post({ code: " eid10 ", discountType: "percentage", value: 10 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ code: "EID10", state: "active" });

    const dup = await post({ code: "Eid10", discountType: "fixed_amount", value: 2000 });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toBe("There's already a code called EID10");
  });

  it("refuses more than 100% and end dates before start dates, including on edit", async () => {
    expect((await post({ code: "TOOMUCH", discountType: "percentage", value: 150 })).body.error).toMatch(/more than 100%/);
    expect(
      (await post({ code: "BACKWARDS", discountType: "fixed_amount", value: 500, startsAt: "2026-12-10T00:00:00Z", expiresAt: "2026-12-01T00:00:00Z" })).status
    ).toBe(422);

    const { body } = await post({ code: "FIXED", discountType: "fixed_amount", value: 5000 });
    // Switching type alone would leave a 5000% discount.
    const res = await put(body.data.id, { discountType: "percentage" });
    expect(res.status).toBe(422);
  });

  it("pauses and resumes a code", async () => {
    const { body } = await post({ code: "PAUSEME", discountType: "percentage", value: 10 });
    expect((await put(body.data.id, { isActive: false })).body.data.state).toBe("paused");
    expect((await put(body.data.id, { isActive: true })).body.data.state).toBe("active");
    const all = await json(await list(jsonRequest("/api/v1/admin/discounts", undefined, owner.headers)));
    expect(all.body.data.discounts[0]).toMatchObject({ code: "PAUSEME", state: "active" });
  });

  it("keeps used codes intact: no rename, no delete, no limit below uses", async () => {
    const used = await createDiscount({ code: "USED5", value: "5" });
    await db.update(discounts).set({ usedCount: 3 }).where(eq(discounts.id, used.id));

    expect((await put(used.id, { code: "NEWNAME" })).status).toBe(409);
    expect((await put(used.id, { maxUses: 2 })).body.error).toMatch(/already been used 3 times/);
    expect((await put(used.id, { maxUses: 3 })).body.data.state).toBe("used_up");
    const removed = await del(used.id);
    expect(removed.status).toBe(409);
    expect(removed.body.error).toMatch(/Pause it instead/);

    const unused = await createDiscount({ code: "NEVER", value: "5" });
    expect((await del(unused.id)).status).toBe(200);
  });
});
