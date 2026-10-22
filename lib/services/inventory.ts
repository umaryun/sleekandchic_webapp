import { and, asc, count, desc, eq, ilike, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, orders, products, productVariants, stockMovements, users } from "@/lib/db/schema";
import { firstImages } from "@/lib/services/cart";

export class InventoryError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

export type StockFilter = "all" | "low" | "out" | "in";

/**
 * Every size and colour on sale (archived products and removed sizes left
 * out), with its stock. Products with no sizes don't track stock and aren't
 * listed.
 */
export async function listInventory(opts: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  stock: StockFilter;
  threshold: number;
  sort: "stock" | "name";
}) {
  const conditions: SQL[] = [eq(productVariants.isActive, true), ne(products.status, "archived")];
  if (opts.search?.trim()) {
    const term = `%${opts.search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term), ilike(productVariants.color, term))!);
  }
  if (opts.categoryId) {
    // A top-level category includes its subcategories.
    conditions.push(
      or(
        eq(products.categoryId, opts.categoryId),
        sql`${products.categoryId} in (select id from categories where parent_id = ${opts.categoryId})`
      )!
    );
  }
  if (opts.stock === "out") conditions.push(lte(productVariants.stockQuantity, 0));
  if (opts.stock === "low") conditions.push(and(lte(productVariants.stockQuantity, opts.threshold), sql`${productVariants.stockQuantity} > 0`)!);
  if (opts.stock === "in") conditions.push(sql`${productVariants.stockQuantity} > ${opts.threshold}`);
  const where = and(...conditions);

  const [[{ total }], [summary]] = await Promise.all([
    db.select({ total: count() }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(where),
    db
      .select({
        units: sql<number>`coalesce(sum(greatest(${productVariants.stockQuantity}, 0)), 0)::int`,
        value: sql<string>`coalesce(sum(greatest(${productVariants.stockQuantity}, 0) * coalesce(${productVariants.priceOverride}, ${products.price})), 0)`,
        out: sql<number>`count(*) filter (where ${productVariants.stockQuantity} <= 0)::int`,
        low: sql<number>`count(*) filter (where ${productVariants.stockQuantity} > 0 and ${productVariants.stockQuantity} <= ${opts.threshold})::int`,
        sizes: sql<number>`count(*)::int`,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(productVariants.isActive, true), ne(products.status, "archived"))),
  ]);

  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productStatus: products.status,
      sku: products.sku,
      categoryName: categories.name,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stockQuantity,
      price: sql<string>`coalesce(${productVariants.priceOverride}, ${products.price})`,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(
      ...(opts.sort === "stock"
        ? [asc(productVariants.stockQuantity), asc(products.name)]
        : [asc(products.name)]),
      asc(productVariants.color),
      asc(productVariants.size)
    )
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);

  const images = await firstImages([...new Set(rows.map((r) => r.productId))]);
  return {
    items: rows.map((r) => ({ ...r, price: Number(r.price), image: images.get(r.productId) ?? null })),
    total,
    summary: { ...summary, value: Number(summary.value), threshold: opts.threshold },
  };
}

export const adjustmentSchema = z
  .object({
    variantId: z.string().uuid(),
    /** add: received or returned; remove: damaged, lost or given away; set: after a count. */
    mode: z.enum(["add", "remove", "set"]),
    quantity: z.number().int().min(0).max(100_000),
    reason: z.enum(["restock", "returned", "damaged", "adjustment"]),
    note: z.string().trim().max(200).optional(),
  })
  .refine((a) => a.mode === "set" || a.quantity > 0, { path: ["quantity"], message: "Enter how many" });

export type Adjustment = z.infer<typeof adjustmentSchema>;

/** Changes one size's stock and records why. Returns the stock before and after. */
export async function adjustStock(input: Adjustment, actorId: string) {
  return db.transaction(async (tx) => {
    const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, input.variantId)).for("update");
    if (!variant || !variant.isActive) throw new InventoryError("That size no longer exists", 404);

    const before = variant.stockQuantity;
    const after =
      input.mode === "set" ? input.quantity : input.mode === "add" ? before + input.quantity : before - input.quantity;
    if (after < 0) throw new InventoryError(`There are only ${Math.max(before, 0)} in stock to remove`);
    const delta = after - before;
    if (delta === 0) return { before, after, changed: false };

    await tx.update(productVariants).set({ stockQuantity: after }).where(eq(productVariants.id, variant.id));
    await tx.insert(stockMovements).values({
      variantId: variant.id,
      productId: variant.productId,
      delta,
      reason: input.reason,
      actorId,
      note: input.note || (input.mode === "set" ? `Stock count: ${after}` : null),
    });
    return { before, after, changed: true, productId: variant.productId };
  });
}

/** Stock history, newest first: for one size, one product, or the whole shop. */
export async function listMovements(opts: { variantId?: string; productId?: string; page: number; limit: number }) {
  const where = and(
    opts.variantId ? eq(stockMovements.variantId, opts.variantId) : undefined,
    opts.productId ? eq(stockMovements.productId, opts.productId) : undefined
  );
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(stockMovements).where(where),
    db
      .select({
        id: stockMovements.id,
        delta: stockMovements.delta,
        reason: stockMovements.reason,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
        variantId: stockMovements.variantId,
        productName: products.name,
        size: productVariants.size,
        color: productVariants.color,
        orderId: stockMovements.orderId,
        orderNumber: orders.orderNumber,
        actorName: users.name,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(productVariants, eq(stockMovements.variantId, productVariants.id))
      .leftJoin(orders, eq(stockMovements.orderId, orders.id))
      .leftJoin(users, eq(stockMovements.actorId, users.id))
      .where(where)
      .orderBy(desc(stockMovements.createdAt))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit),
  ]);
  return { movements: rows, total };
}
