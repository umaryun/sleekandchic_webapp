import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";

export const MAX_ADDRESSES = 10;

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  firstName: z.string().trim().min(1, "Enter the recipient's first name").max(100),
  lastName: z.string().trim().min(1, "Enter the recipient's last name").max(100),
  phone: z.string().trim().min(7, "Enter a phone number the courier can call").max(30),
  street: z.string().trim().min(1, "Enter the street address"),
  city: z.string().trim().min(1, "Enter the city or town").max(100),
  state: z.string().trim().min(1, "Choose a state").max(100),
  isDefault: z.boolean().optional(),
});

/** The address, if it belongs to this user. */
export async function ownAddress(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .limit(1);
  return row ?? null;
}
