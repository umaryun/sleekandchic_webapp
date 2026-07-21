import { NextRequest, NextResponse } from "next/server";

const ADMIN_ORIGINS = (process.env.ADMIN_APP_URL || "http://localhost:3001,http://localhost:3002,http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (ADMIN_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") || "";

  const isApiRoute = pathname.startsWith("/api/v1/admin") || pathname.startsWith("/api/auth");

  // ─── CORS preflight for API routes ───
  if (isApiRoute && req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  // ─── CORS headers for API responses ───
  if (isApiRoute && isAllowedOrigin(origin)) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  // ─── Security headers for all API routes ───
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
