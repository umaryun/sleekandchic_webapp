import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { apiError, apiSuccess, internalError, requireAdmin, withCors } from "@/lib/api-utils";
import { listCustomers } from "@/lib/services/customers";
import { firstImages } from "@/lib/services/cart";

const querySchema = z.object({ q: z.string().trim().min(2).max(100) });

/** GET /admin/search?q= — a few orders, products and customers for the admin's quick search. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    if (!parsed.success) return withCors(apiError("Type at least 2 characters", 422), req);
    const { q } = parsed.data;
    const term = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const digits = q.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");

    const [orderRows, productRows, { customers }] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
          name: sql<string>`nullif(trim(concat_ws(' ', ${orders.shippingAddress}->>'firstName', ${orders.shippingAddress}->>'lastName')), '')`,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          or(
            ilike(orders.orderNumber, term),
            ilike(orders.guestEmail, term),
            sql`concat_ws(' ', ${orders.shippingAddress}->>'firstName', ${orders.shippingAddress}->>'lastName') ilike ${term}`,
            ...(digits.length >= 4
              ? [sql`regexp_replace(${orders.shippingAddress}->>'phone', '[^0-9]', '', 'g') like ${`%${digits}%`}`]
              : [])
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(5),
      db
        .select({ id: products.id, name: products.name, sku: products.sku, status: products.status, price: products.price })
        .from(products)
        .where(and(ne(products.status, "archived"), or(ilike(products.name, term), ilike(products.sku, term))))
        .orderBy(desc(products.updatedAt))
        .limit(5),
      listCustomers({ page: 1, limit: 5, search: q }),
    ]);

    const images = await firstImages(productRows.map((p) => p.id));
    return withCors(
      apiSuccess({
        orders: orderRows.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
        products: productRows.map((p) => ({ ...p, price: Number(p.price), image: images.get(p.id) ?? null })),
        customers,
      }),
      req
    );
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/search", err);
  }
}
