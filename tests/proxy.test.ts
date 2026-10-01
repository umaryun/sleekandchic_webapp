import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const preflight = (origin: string) =>
  proxy(
    new NextRequest("http://localhost:3000/api/v1/admin/team/abc", {
      method: "OPTIONS",
      headers: { origin, "access-control-request-method": "PATCH" },
    })
  );

describe("admin API CORS", () => {
  it("lets the admin console send PATCH and read the session token header", () => {
    const res = preflight("http://localhost:3001");
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3001");
    expect(res.headers.get("access-control-allow-methods")).toContain("PATCH");
    expect(res.headers.get("access-control-expose-headers")).toBe("set-auth-token");
  });

  it("doesn't allow other origins, including other localhost ports outside development", () => {
    for (const origin of ["https://evil.example", "http://localhost:4000"]) {
      expect(preflight(origin).headers.get("access-control-allow-origin")).toBeNull();
    }
  });
});
