import type {
  Product,
  Category,
  HeroSlide,
  ApiResponse,
  ProductsResponse,
} from "@/types";

// ──────────────────────────────────────────────
// Base URL (always relative for same-origin)
// ──────────────────────────────────────────────

const BASE = "/api/v1/store";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Unknown API error");
  }
  return json.data;
}

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  badge?: "sale" | "new" | "hot";
  /** Only products the shop marks as featured. */
  featured?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "rating" | "name";
}

export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.minPrice !== undefined)
    query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    query.set("maxPrice", String(params.maxPrice));
  if (params.badge) query.set("badge", params.badge);
  if (params.featured) query.set("featured", "1");
  if (params.sort) query.set("sort", params.sort);

  const qs = query.toString();
  return apiFetch<ProductsResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProduct(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────

// The menu, mobile menu, home tiles and shop filters all want the category
// list; one request per few minutes serves them all.
const CATEGORY_TTL_MS = 5 * 60 * 1000;
let categoriesRequest: { at: number; promise: Promise<Category[]> } | null = null;

export function fetchCategories(): Promise<Category[]> {
  if (!categoriesRequest || Date.now() - categoriesRequest.at > CATEGORY_TTL_MS) {
    const promise = apiFetch<Category[]>("/categories");
    categoriesRequest = { at: Date.now(), promise };
    // A failed request isn't kept, so the next caller tries again.
    promise.catch(() => {
      if (categoriesRequest?.promise === promise) categoriesRequest = null;
    });
  }
  return categoriesRequest.promise;
}

// ──────────────────────────────────────────────
// Hero Slides
// ──────────────────────────────────────────────

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  return apiFetch<HeroSlide[]>("/hero-slides");
}
