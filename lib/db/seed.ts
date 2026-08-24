import { db } from "./index";
import { categories, products, productImages, productVariants, heroSlides, users } from "./schema";
import { categories as defaultCategories, products as defaultProducts, heroSlides as defaultSlides } from "@/data/index";
import { slugify } from "../api-utils";
import { eq } from "drizzle-orm";

async function seed() {
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
        description: item.description || `High quality ${item.name} for modern style.`,
        price: String(priceNGN),
        originalPrice: origPriceNGN ? String(origPriceNGN) : null,
        sku: item.sku || `SC-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: item.brand || "Slickandchic",
        badge: item.badge || null,
        discount: item.discount || null,
        rating: item.rating || 5,
        reviewCount: item.reviewCount || 10,
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
    const colors = item.colors && item.colors.length > 0 ? item.colors : ["Default"];

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

  // 3. Seed Hero Slides
  for (let i = 0; i < defaultSlides.length; i++) {
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
  console.log("Seeded hero slides.");

  // 4. Ensure Super Admin Accounts exist
  const superAdminEmails = ["admin@slickandchic.com", "umaryunusa443@gmail.com"];
  for (const email of superAdminEmails) {
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (adminUser && adminUser.role !== "super_admin") {
      await db
        .update(users)
        .set({ role: "super_admin" })
        .where(eq(users.id, adminUser.id));
      console.log(`Elevated ${email} to super_admin.`);
    }
  }

  console.log("Database seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
