import { NextRequest, NextResponse } from "next/server";
import { adminAppOrigins } from "@/lib/env";

const isDevelopment = process.env.NODE_ENV === "development";

/** The admin console's origins, plus any localhost port while developing. */
function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (adminAppOrigins.includes(origin)) return true;
  return isDevelopment && /^http:\/\/localhost:\d+$/.test(origin);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // better-auth's bearer plugin returns the session token in this header.
  "Access-Control-Expose-Headers": "set-auth-token",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

/**
 * CORS for the admin console, which runs on its own origin and calls the
 * admin and auth APIs. Security headers for every page are in next.config.ts.
 */
export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowed = isAllowedOrigin(origin);

  const response = req.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();
  response.headers.set("Vary", "Origin");
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [name, value] of Object.entries(CORS_HEADERS)) response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: ["/api/v1/admin/:path*", "/api/auth/:path*"],
};
