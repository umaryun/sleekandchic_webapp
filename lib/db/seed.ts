import { db } from "./index";
import { categories, products, productImages, productVariants, heroSlides } from "./schema";
import { categories as defaultCategories, products as defaultProducts, heroSlides as defaultSlides } from "@/data/index";
import { slugify } from "../api-utils";
import { count, eq } from "drizzle-orm";

// Sample catalogue for development. Safe to run more than once: existing
// categories and products are skipped and slides are only added when there
// are none. To give someone owner access, use `npm run db:make-owner`.
async function seed() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "1") {
    throw new Error("This adds sample products. Set SEED_ALLOW_PRODUCTION=1 if you really want them in production.");
  }
  console.log("Starting database seed...");

  // 1. Seed Categories
  const categoryMap = new Map<string, string>(); // name -> id

  for (let i = 0; i < defaultCategories.length; i++) {
    const cat = defaultCategories[i];
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, cat.slug))
      .limit(1);

    if (existing) {
      categoryMap.set(cat.name, existing.id);
    } else {
      const [inserted] = await db
        .insert(categories)
        .values({
          name: cat.name,
          slug: cat.slug,
          displayOrder: i,
        })
        .returning();
      categoryMap.set(cat.name, inserted.id);
    }
  }
  console.log(`Seeded ${categoryMap.size} categories.`);

  // 2. Seed Products
  for (const item of defaultProducts) {
    const slug = slugify(item.name);

    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existingProduct) continue;

    // Convert sample USD price to NGN (multiply by 1500 for realistic Naira amounts)
    const priceNGN = Math.round(item.price * 1500);
    const origPriceNGN = item.originalPrice ? Math.round(item.originalPrice * 1500) : null;
    const categoryId = categoryMap.get(item.category) || null;

    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug,
        description: item.description ?? null,
        price: String(priceNGN),
        originalPrice: origPriceNGN ? String(origPriceNGN) : null,
        sku: item.sku || `SC-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: item.brand || "Sleekandchic",
        badge: item.badge || null,
        discount: item.discount || null,
        // Ratings come only from real reviews; seeded products start with none.
        inStock: item.inStock ?? true,
        categoryId,
      })
      .returning();

    // Insert Product Images
    const imagesToInsert = item.images && item.images.length > 0 ? item.images : [item.image];
    await db.insert(productImages).values(
      imagesToInsert.filter(Boolean).map((imgUrl, idx) => ({
        productId: product.id,
        imageUrl: imgUrl as string,
        altText: item.name,
        displayOrder: idx,
      }))
    );

    // Insert Product Variants
    const sizes = item.sizes && item.sizes.length > 0 ? item.sizes : ["S", "M", "L", "XL"];
    // No colour rather than one literally called "Default".
    const colors: (string | null)[] = item.colors && item.colors.length > 0 ? item.colors : [null];

    const variantValues = [];
    for (const s of sizes) {
      for (const c of colors) {
        variantValues.push({
          productId: product.id,
          size: s,
          color: c,
          stockQuantity: 25,
        });
      }
    }
    if (variantValues.length > 0) {
      await db.insert(productVariants).values(variantValues);
    }
  }
  console.log("Seeded products with images and variants.");

  // 3. Seed Hero Slides (only into an empty table, so reruns don't duplicate them)
  const [{ slides }] = await db.select({ slides: count() }).from(heroSlides);
  for (let i = 0; slides === 0 && i < defaultSlides.length; i++) {
    const slide = defaultSlides[i];
    await db.insert(heroSlides).values({
      boldText: slide.title || "New Arrival Collection",
      regularText: slide.subtitle || "Shop the latest luxury fashion",
      linkText: "Shop Now",
      href: slide.href || "/products",
      imageUrl: slide.image,
      displayOrder: i,
      isActive: true,
    });
  }
  console.log(slides === 0 ? "Seeded hero slides." : "Hero slides already exist; left as they are.");

  console.log("Database seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
