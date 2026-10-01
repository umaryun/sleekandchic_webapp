import { NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";
import { apiSuccess, apiError, parseBody, requireAuth } from "@/lib/api-utils";
import { addressSchema, MAX_ADDRESSES } from "@/lib/services/addresses";

/** GET — the signed-in customer's saved addresses, default first. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const rows = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, session.user.id))
      .orderBy(desc(userAddresses.isDefault), asc(userAddresses.createdAt));
    return apiSuccess(rows);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/store/addresses error:", err);
    return apiError("Internal server error", 500);
  }
}

/** POST — save a new address. The first one saved becomes the default. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { data, error } = await parseBody(req, addressSchema);
    if (error) return error;
    const userId = session.user.id;

    const created = await db.transaction(async (tx) => {
      const existing = await tx.select({ id: userAddresses.id }).from(userAddresses).where(eq(userAddresses.userId, userId));
      if (existing.length >= MAX_ADDRESSES) return null;
      const makeDefault = data!.isDefault || existing.length === 0;
      if (makeDefault) {
        await tx.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
      }
      const [row] = await tx
        .insert(userAddresses)
        .values({ ...data!, userId, country: "Nigeria", isDefault: makeDefault })
        .returning();
      return row;
    });
    if (!created) return apiError(`You can save up to ${MAX_ADDRESSES} addresses. Remove one first.`, 409);
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/addresses error:", err);
    return apiError("Internal server error", 500);
  }
}
