import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resetTestDb } from "./support/test-db";
import { json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { GET as listAddresses, POST as addAddress } from "@/app/api/v1/store/addresses/route";
import { PATCH as editAddress, DELETE as deleteAddress } from "@/app/api/v1/store/addresses/[id]/route";

const HOME = { firstName: "Aisha", lastName: "Bello", phone: "08030000000", street: "12 Ahmadu Bello Way", city: "Kaduna", state: "Kaduna" };
const OFFICE = { ...HOME, street: "3 Independence Way", city: "Abuja", state: "Abuja (FCT)" };

const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (method: string, url: string, headers: Record<string, string>, body?: unknown) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(resetTestDb);

describe("saved addresses", () => {
  it("requires sign-in", async () => {
    expect((await listAddresses(jsonRequest("/api/v1/store/addresses"))).status).toBe(401);
  });

  it("makes the first address the default and keeps exactly one default", async () => {
    const { headers } = await signUpCustomer();
    const home = await json(await addAddress(jsonRequest("/api/v1/store/addresses", HOME, headers)));
    expect(home.status).toBe(201);
    expect(home.body.data.isDefault).toBe(true);

    const office = await json(await addAddress(jsonRequest("/api/v1/store/addresses", { ...OFFICE, isDefault: true }, headers)));
    const list = await json(await listAddresses(jsonRequest("/api/v1/store/addresses", undefined, headers)));
    expect(list.body.data.map((a: { id: string; isDefault: boolean }) => [a.id, a.isDefault])).toEqual([
      [office.body.data.id, true],
      [home.body.data.id, false],
    ]);

    await editAddress(req("PATCH", `/api/v1/store/addresses/${home.body.data.id}`, headers, { isDefault: true }), withId(home.body.data.id));
    const after = await json(await listAddresses(jsonRequest("/api/v1/store/addresses", undefined, headers)));
    expect(after.body.data.filter((a: { isDefault: boolean }) => a.isDefault)).toHaveLength(1);
    expect(after.body.data[0].id).toBe(home.body.data.id);
  });

  it("promotes another address when the default is deleted", async () => {
    const { headers } = await signUpCustomer();
    const home = await json(await addAddress(jsonRequest("/api/v1/store/addresses", HOME, headers)));
    const office = await json(await addAddress(jsonRequest("/api/v1/store/addresses", OFFICE, headers)));
    await deleteAddress(req("DELETE", `/api/v1/store/addresses/${home.body.data.id}`, headers), withId(home.body.data.id));
    const list = await json(await listAddresses(jsonRequest("/api/v1/store/addresses", undefined, headers)));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ id: office.body.data.id, isDefault: true });
  });

  it("won't let one customer touch another's address", async () => {
    const owner = await signUpCustomer();
    const other = await signUpCustomer();
    const home = await json(await addAddress(jsonRequest("/api/v1/store/addresses", HOME, owner.headers)));
    const id = home.body.data.id;
    expect((await editAddress(req("PATCH", `/api/v1/store/addresses/${id}`, other.headers, { street: "x" }), withId(id))).status).toBe(404);
    expect((await deleteAddress(req("DELETE", `/api/v1/store/addresses/${id}`, other.headers), withId(id))).status).toBe(404);
    const otherList = await json(await listAddresses(jsonRequest("/api/v1/store/addresses", undefined, other.headers)));
    expect(otherList.body.data).toHaveLength(0);
  });

  it("explains invalid input", async () => {
    const { headers } = await signUpCustomer();
    const res = await json(await addAddress(jsonRequest("/api/v1/store/addresses", { ...HOME, phone: "12" }, headers)));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/phone number the courier can call/);
  });
});
