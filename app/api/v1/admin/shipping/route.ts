import { NextRequest } from "next/server";
import { z } from "zod";
import { isNigerianState } from "@/lib/nigeria";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { asc, eq, ilike, and, count } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  withCors,
  parseBody,
  auditLog,
  paginationMeta,
} from "@/lib/api-utils";
import { invalidateShippingCache, ZONE_NAMES } from "@/lib/shipping";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  zone: z.string().optional(),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  all: z.enum(["true", "false"]).optional().default("false"),
});

/**
 * GET /api/v1/admin/shipping
 * List all shipping rates / delivery fees with filtering & pagination
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) return apiError("Invalid query parameters", 422);

    const { page, limit, search, zone, isActive, all } = parsed.data;

    const conditions = [];

    if (search && search.trim()) {
      conditions.push(ilike(shippingRates.state, `%${search.trim()}%`));
    }

    if (zone && zone !== "all") {
      conditions.push(eq(shippingRates.zone, zone.toUpperCase()));
    }

    if (isActive !== "all") {
      conditions.push(eq(shippingRates.isActive, isActive === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(shippingRates)
      .where(whereClause);

    // If all=true, return all matching records without pagination
    const query = db
      .select()
      .from(shippingRates)
      .where(whereClause)
      .orderBy(asc(shippingRates.zone), asc(shippingRates.state));

    const rows = all === "true" ? await query : await query.limit(limit).offset((page - 1) * limit);

    // Compute zone summaries
    const allActiveRows = await db
      .select({ zone: shippingRates.zone, count: count() })
      .from(shippingRates)
      .where(eq(shippingRates.isActive, true))
      .groupBy(shippingRates.zone);

    const zoneCounts: Record<string, number> = {};
    for (const r of allActiveRows) {
      zoneCounts[r.zone] = Number(r.count);
    }

    const response = apiSuccess({
      shippingRates: rows.map((r) => ({
        ...r,
        zoneName: ZONE_NAMES[r.zone] || `Zone ${r.zone}`,
      })),
      pagination: paginationMeta(total, page, limit),
      summary: {
        total,
        zoneCounts,
        zoneNames: ZONE_NAMES,
      },
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/admin/shipping error:", err);
    return apiError("Internal server error", 500);
  }
}

const createShippingRateSchema = z.object({
  // Must match the state names checkout uses, or the rate is never found.
  state: z.string().trim().refine(isNigerianState, "Use one of the 36 states or Abuja (FCT), spelt as in the list"),
  zone: z.string().min(1).default("C"),
  standardBase: z.number().int().min(0, "Standard base fee must be positive or zero"),
  expressBase: z.number().int().min(0, "Express base fee must be positive or zero"),
  estimatedDaysStandard: z.string().min(1).default("3–5 days"),
  estimatedDaysExpress: z.string().min(1).default("1–2 days"),
  freeShippingThreshold: z.number().int().min(0).default(75000),
  isActive: z.boolean().default(true),
});

/**
 * POST /api/v1/admin/shipping
 * Create a new location / state delivery fee
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { data, error } = await parseBody(req, createShippingRateSchema);
    if (error) return error;

    const trimmedState = data!.state.trim();

    // Check if location already exists
    const [existing] = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.state, trimmedState))
      .limit(1);

    if (existing) {
      return apiError(`A delivery rate for "${trimmedState}" already exists`, 409);
    }

    const [created] = await db
      .insert(shippingRates)
      .values({
        state: trimmedState,
        zone: data!.zone.toUpperCase(),
        standardBase: data!.standardBase,
        expressBase: data!.expressBase,
        estimatedDaysStandard: data!.estimatedDaysStandard,
        estimatedDaysExpress: data!.estimatedDaysExpress,
        freeShippingThreshold: data!.freeShippingThreshold,
        isActive: data!.isActive,
      })
      .returning();

    // Invalidate shipping cache
    invalidateShippingCache();

    await auditLog(session.user.id, "create", "shipping_rate", {
      id: created.id,
      state: created.state,
      zone: created.zone,
      standardBase: created.standardBase,
      expressBase: created.expressBase,
    });

    const response = apiSuccess(
      {
        ...created,
        zoneName: ZONE_NAMES[created.zone] || `Zone ${created.zone}`,
      },
      201
    );
    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/shipping error:", err);
    return apiError("Internal server error", 500);
  }
}
