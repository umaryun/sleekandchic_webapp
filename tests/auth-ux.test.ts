import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { resetTestDb } from "./support/test-db";
import { normalizeNigerianPhone } from "@/lib/phone";
import { safeRedirect } from "@/lib/redirect";

describe("phone numbers", () => {
  it("accepts the usual ways of writing a Nigerian mobile number", () => {
    for (const typed of ["0803 000 0000", "+234 803 000 0000", "2348030000000", "(0803)-000-0000", "8030000000"]) {
      expect(normalizeNigerianPhone(typed)).toBe("+2348030000000");
    }
  });

  it("rejects what a courier couldn't call", () => {
    for (const typed of ["12345", "0803 000 000", "0603 000 0000", "+1 415 555 0100", "call me"]) {
      expect(normalizeNigerianPhone(typed)).toBeNull();
    }
  });
});

describe("after signing in", () => {
  it("goes back to a page on this site only", () => {
    expect(safeRedirect("/checkout")).toBe("/checkout");
    expect(safeRedirect("/products?category=abayas")).toBe("/products?category=abayas");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "", null]) {
      expect(safeRedirect(bad)).toBe("/");
    }
  });
});

describe("sign-up", () => {
  beforeEach(resetTestDb);

  it("keeps the phone number, in +234 form", async () => {
    const res = await auth.api.signUpEmail({
      body: { email: "amina@example.com", password: "a-long-password", name: "Amina", phone: "0803 000 0000" } as never,
    });
    const [user] = await db.select().from(users).where(eq(users.id, res.user.id));
    expect(user.phone).toBe("+2348030000000");
  });
});
