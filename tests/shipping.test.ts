import { describe, expect, it } from "vitest";
import { calculateShippingQuote, DEFAULT_STATE_ZONES, matchZoneInfo } from "@/lib/shipping-base";
import { NIGERIAN_STATES } from "@/lib/nigeria";

describe("delivery rates", () => {
  it("has exactly one rate per state, under the names checkout uses", () => {
    expect(Object.keys(DEFAULT_STATE_ZONES).sort()).toEqual([...NIGERIAN_STATES].sort());
  });

  it("never prices an unknown or blank state as somewhere else", () => {
    expect(matchZoneInfo("Atlantis")).toBeNull();
    expect(matchZoneInfo("")).toBeNull();
    expect(calculateShippingQuote("Atlantis", "standard", 10000, 1)).toMatchObject({ deliverable: false, fee: 0 });
  });

  it("matches state names whatever the case, keeping Nasarawa's rate", () => {
    expect(calculateShippingQuote("nasarawa", "standard", 10000, 1)).toMatchObject({ deliverable: true, zone: "B", fee: 2500 });
  });

  it("adds ₦200 per item beyond three", () => {
    expect(calculateShippingQuote("Kaduna", "express", 10000, 5).fee).toBe(3500 + 2 * 200);
  });
});

describe("state checks on the server", () => {
  it("refuses a state that isn't one of the 37", async () => {
    const { POST: quote } = await import("@/app/api/v1/store/checkout/quote/route");
    const { jsonRequest, json } = await import("./support/fixtures");
    const res = await json(await quote(jsonRequest("/api/v1/store/checkout/quote", { state: "Nassarawa", shippingMethod: "standard" })));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Choose your state from the list/);
  });
});
