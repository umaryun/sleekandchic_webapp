import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { resetTestDb } from "./support/test-db";
import { json, jsonRequest, signUpCustomer } from "./support/fixtures";
import { POST as invite } from "@/app/api/v1/admin/team/invite/route";
import { GET as me } from "@/app/api/v1/admin/me/route";
import { GET as teamList } from "@/app/api/v1/admin/team/route";

let owner: Awaited<ReturnType<typeof signUpCustomer>>;

beforeEach(async () => {
  await resetTestDb();
  owner = await signUpCustomer("owner@example.com");
  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, owner.userId));
});

async function signIn(email: string, password: string) {
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const body = await res.json();
  return { status: res.status, headers: { authorization: `Bearer ${body.token}` } };
}

describe("inviting staff", () => {
  it("emails a new staff member a set-password link instead of taking a password", async () => {
    const res = await json(await invite(jsonRequest("/api/v1/admin/team/invite", { name: "Zainab", email: "Zainab@Example.com", role: "admin" }, owner.headers)));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: "zainab@example.com", status: "invited", invitation: { emailSent: false } });

    // Email isn't configured in tests, so the owner gets the link to pass on.
    const link = new URL(res.body.data.invitation.setupLink);
    expect(link.origin + link.pathname).toBe("http://localhost:3001/set-password");
    const token = link.searchParams.get("token")!;

    const reset = await auth.api.resetPassword({ body: { token, newPassword: "a-long-staff-password" }, asResponse: true });
    expect(reset.status).toBe(200);
    // The link works once.
    const again = await auth.api.resetPassword({ body: { token, newPassword: "another-long-password" }, asResponse: true });
    expect(again.status).toBe(400);

    const login = await signIn("zainab@example.com", "a-long-staff-password");
    expect(login.status).toBe(200);
    const profile = await json(await me(jsonRequest("/api/v1/admin/me", undefined, login.headers)));
    expect(profile.body.data).toMatchObject({ email: "zainab@example.com", role: "admin" });

    const team = await json(await teamList(jsonRequest("/api/v1/admin/team", undefined, owner.headers)));
    expect(team.body.data.admins.find((a: { email: string }) => a.email === "zainab@example.com").status).toBe("active");
  });

  it("gives an existing customer access without touching their password", async () => {
    const customer = await signUpCustomer("regular@example.com");
    const res = await json(await invite(jsonRequest("/api/v1/admin/team/invite", { name: "Someone Else", email: "regular@example.com" }, owner.headers)));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Aisha Bello", role: "admin", status: "active", invitation: { setupLink: null } });

    const login = await signIn("regular@example.com", "correct-horse-battery");
    expect(login.status).toBe(200);
    expect((await me(jsonRequest("/api/v1/admin/me", undefined, customer.headers))).status).toBe(200);
  });

  it("refuses someone already on the team", async () => {
    const res = await json(await invite(jsonRequest("/api/v1/admin/team/invite", { name: "Owner", email: "owner@example.com" }, owner.headers)));
    expect(res.status).toBe(409);
  });

  it("is for the owner only", async () => {
    const staff = await signUpCustomer("staff@example.com");
    await db.update(users).set({ role: "admin" }).where(eq(users.id, staff.userId));
    const res = await json(await invite(jsonRequest("/api/v1/admin/team/invite", { name: "X", email: "x@example.com" }, staff.headers)));
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Only the store owner can do this");
  });
});

describe("admin sessions", () => {
  it("tells the console when a customer signs in", async () => {
    const customer = await signUpCustomer("shopper@example.com");
    const res = await json(await me(jsonRequest("/api/v1/admin/me", undefined, customer.headers)));
    expect(res.status).toBe(403);
  });

  it("asks staff to sign in again after 12 hours", async () => {
    expect((await me(jsonRequest("/api/v1/admin/me", undefined, owner.headers))).status).toBe(200);
    await db.update(sessions).set({ createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) }).where(eq(sessions.userId, owner.userId));
    const res = await json(await me(jsonRequest("/api/v1/admin/me", undefined, owner.headers)));
    expect(res.status).toBe(401);
  });
});
