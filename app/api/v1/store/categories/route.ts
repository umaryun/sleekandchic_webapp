import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { asc, eq, sql, count } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder));

    // Get product counts per category
    const counts = await db
      .select({
        categoryId: products.categoryId,
        count: count(),
      })
      .from(products)
      .groupBy(products.categoryId);

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.categoryId) {
        countMap.set(c.categoryId, c.count);
      }
    }

    // Build hierarchical structure
    type CategoryNode = {
      id: string;
      name: string;
      slug: string;
      iconUrl: string | null;
      displayOrder: number;
      productCount: number;
      children: CategoryNode[];
    };

    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const cat of allCategories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconUrl: cat.iconUrl,
        displayOrder: cat.displayOrder,
        productCount: countMap.get(cat.id) || 0,
        children: [],
      });
    }

    for (const cat of allCategories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const response = apiSuccess(roots);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return response;
  } catch (err) {
    console.error("GET /api/v1/store/categories error:", err);
    return apiError("Internal server error", 500);
  }
}

