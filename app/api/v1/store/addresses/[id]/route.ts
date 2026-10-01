import { NextRequest } from "next/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";
import { apiSuccess, apiError, parseBody, requireAuth } from "@/lib/api-utils";
import { addressSchema, ownAddress } from "@/lib/services/addresses";

type Params = { params: Promise<{ id: string }> };

/** PATCH — edit an address, or make it the default with { isDefault: true }. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const { data, error } = await parseBody(req, addressSchema.partial());
    if (error) return error;
    if (!(await ownAddress(session.user.id, id))) return apiError("Address not found", 404);

    const updated = await db.transaction(async (tx) => {
      if (data!.isDefault) {
        await tx
          .update(userAddresses)
          .set({ isDefault: false })
          .where(and(eq(userAddresses.userId, session.user.id), ne(userAddresses.id, id)));
      }
      const { isDefault, ...fields } = data!;
      const [row] = await tx
        .update(userAddresses)
        // An address can't stop being the default directly; choose another instead.
        .set({ ...fields, ...(isDefault ? { isDefault: true } : {}) })
        .where(eq(userAddresses.id, id))
        .returning();
      return row;
    });
    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/v1/store/addresses/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

/** DELETE — remove an address. Removing the default promotes the oldest remaining one. */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const address = await ownAddress(session.user.id, id);
    if (!address) return apiError("Address not found", 404);

    await db.transaction(async (tx) => {
      await tx.delete(userAddresses).where(eq(userAddresses.id, id));
      if (address.isDefault) {
        const [next] = await tx
          .select({ id: userAddresses.id })
          .from(userAddresses)
          .where(eq(userAddresses.userId, session.user.id))
          .orderBy(asc(userAddresses.createdAt))
          .limit(1);
        if (next) await tx.update(userAddresses).set({ isDefault: true }).where(eq(userAddresses.id, next.id));
      }
    });
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/store/addresses/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}
