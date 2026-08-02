import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
// import { headers } from "next/headers";

// ──────────────────────────────────────────────
// Response Helpers
// ──────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ──────────────────────────────────────────────
// Zod Parsing
// ──────────────────────────────────────────────

export async function parseBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T> | null; error: NextResponse | null }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const messages = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return { data: null, error: apiError(`Validation failed: ${messages}`, 422) };
    }
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: apiError("Invalid JSON body", 400) };
  }
}

export function parseQuery<T extends z.ZodType>(
  url: string,
  schema: T
): { data: z.infer<T> | null; error: NextResponse | null } {
  const { searchParams } = new URL(url);
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { data: null, error: apiError(`Invalid query: ${messages}`, 422) };
  }
  return { data: result.data, error: null };
}

// ──────────────────────────────────────────────
// Auth Helpers
// ──────────────────────────────────────────────

export async function getSession(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session;
}

export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    throw apiError("Unauthorized", 401);
  }
  return session;
}

export async function requireAdmin(req: NextRequest) {
  const session = await requireAuth(req);
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "super_admin") {
    throw apiError("Forbidden: Admin access required", 403);
  }
  return session;
}

// ──────────────────────────────────────────────
// CORS Helper
// ──────────────────────────────────────────────

const ADMIN_ORIGINS = (process.env.ADMIN_APP_URL || "http://localhost:3001")
  .split(",")
  .map((s) => s.trim());

export function withCors(response: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && ADMIN_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
  return response;
}

// ──────────────────────────────────────────────
// Audit Logging
// ──────────────────────────────────────────────

export async function auditLog(
  adminId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      adminId,
      action,
      resource,
      details: details ?? null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

// ──────────────────────────────────────────────
// Order Number Generator
// ──────────────────────────────────────────────

export function generateOrderNumber(): string {
  const prefix = "SC";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ──────────────────────────────────────────────
// Slug Generator
// ──────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
