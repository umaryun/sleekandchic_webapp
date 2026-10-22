import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { apiError, apiSuccess, internalError, parseBody, requireAdmin, withCors } from "@/lib/api-utils";

const updateSchema = z.object({ status: z.enum(["new", "read", "archived"]) });

/** PUT /admin/messages/:id — mark read or unread, archive or bring back. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return withCors(apiError("Message not found", 404), req);
    const { data, error } = await parseBody(req, updateSchema);
    if (error) return withCors(error, req);

    const [updated] = await db
      .update(contactMessages)
      .set({ status: data!.status, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!updated) return withCors(apiError("Message not found", 404), req);
    return withCors(apiSuccess(updated), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("PUT /api/v1/admin/messages/[id]", err);
  }
}
