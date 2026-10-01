import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { json, jsonRequest } from "./support/fixtures";
import { LIMITS, clientIp } from "@/lib/rate-limit";
import { GET as track } from "@/app/api/v1/store/orders/tracking/route";
import { POST as contact } from "@/app/api/v1/store/contact/route";

beforeEach(resetTestDb);

const lookup = (ip: string) =>
  track(jsonRequest("/api/v1/store/orders/tracking?order_number=SC-NOPE&contact=a@b.com", undefined, { "x-forwarded-for": ip }));

describe("request limits", () => {
  it("stops order lookups after the limit, per client", async () => {
    for (let i = 0; i < LIMITS.tracking.max; i++) {
      expect((await lookup("203.0.113.7")).status).toBe(404);
    }
    const blocked = await json(await lookup("203.0.113.7"));
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many attempts. Please wait 10 minutes/);

    // Someone else is unaffected.
    expect((await lookup("198.51.100.2")).status).toBe(404);
  });

  it("starts a fresh window once the old one ends", async () => {
    for (let i = 0; i <= LIMITS.tracking.max; i++) await lookup("203.0.113.7");
    expect((await lookup("203.0.113.7")).status).toBe(429);

    await db.update(rateLimits).set({ resetAt: sql`now() - interval '1 second'` });
    expect((await lookup("203.0.113.7")).status).toBe(404);
  });

  it("sends Retry-After with the 429", async () => {
    const send = () =>
      contact(jsonRequest("/api/v1/store/contact", { name: "A", email: "a@b.com", message: "Hello there" }, { "x-forwarded-for": "203.0.113.9" }));
    for (let i = 0; i < LIMITS.contact.max; i++) await send();
    const res = await send();
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(3000);
  });

  it("uses the first x-forwarded-for entry", () => {
    const req = jsonRequest("/x", undefined, { "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(req)).toBe("203.0.113.7");
  });
});
