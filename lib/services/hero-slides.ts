import { z } from "zod";
import { isSafeHref, SAFE_HREF_MESSAGE } from "@/lib/links";

// Blank clears a field; leaving it out (on edit) keeps it.
const blankToNull = (v: string | null | undefined) => (v === undefined ? undefined : v || null);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep it to ${max} characters`).nullable().optional().transform(blankToNull);

/** What staff can set on a homepage slide. */
export const slideFieldsSchema = z.object({
  boldText: optionalText(80),
  regularText: optionalText(160),
  linkText: optionalText(30),
  href: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform(blankToNull)
    .refine((v) => !v || isSafeHref(v), SAFE_HREF_MESSAGE),
  imageUrl: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
