import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { slugify } from "@/lib/api-utils";

/** What staff can set on a category. A blank slug is made from the name. */
export const categoryFieldsSchema = z.object({
  name: z.string().trim().min(1, "Give the category a name").max(100),
  slug: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? slugify(v) : undefined)),
  iconUrl: z.string().url().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * Why `parentId` can't be the parent of category `id` (null for a new one),
 * or null if it can. Keeps categories two levels deep, which also rules out
 * loops.
 */
export async function parentProblem(id: string | null, parentId: string | null | undefined): Promise<string | null> {
  if (!parentId) return null;
  if (parentId === id) return "A category can't be inside itself.";
  const [parent] = await db.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, parentId)).limit(1);
  if (!parent) return "That parent category doesn't exist.";
  if (parent.parentId) return "Choose a top-level category as the parent; categories go one level deep.";
  if (id) {
    const [{ children }] = await db.select({ children: count() }).from(categories).where(eq(categories.parentId, id));
    if (children > 0) return "This category has subcategories of its own, so it can't go inside another.";
  }
  return null;
}
