import { NextRequest } from "next/server";
import { z } from "zod";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { apiError, apiSuccess, internalError, paginationMeta, requireAdmin, withCors } from "@/lib/api-utils";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  // "inbox" is new and read; archived messages are kept out of the way.
  box: z.enum(["inbox", "new", "archived"]).default("inbox"),
  search: z.string().max(100).optional(),
});

/** GET /admin/messages — what customers sent through the contact form. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Invalid query parameters", 422), req);
    const { page, limit, box, search } = parsed.data;

    const term = search?.trim() ? `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const where = and(
      box === "archived"
        ? eq(contactMessages.status, "archived")
        : box === "new"
          ? eq(contactMessages.status, "new")
          : or(eq(contactMessages.status, "new"), eq(contactMessages.status, "read")),
      term
        ? or(
            ilike(contactMessages.name, term),
            ilike(contactMessages.email, term),
            ilike(contactMessages.message, term),
            ilike(contactMessages.orderNumber, term)
          )
        : undefined
    );

    const [[{ total }], [{ unread }], messages] = await Promise.all([
      db.select({ total: count() }).from(contactMessages).where(where),
      db.select({ unread: count() }).from(contactMessages).where(eq(contactMessages.status, "new")),
      db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(desc(contactMessages.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
    ]);
    return withCors(apiSuccess({ messages, unread, pagination: paginationMeta(total, page, limit) }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/messages", err);
  }
}
