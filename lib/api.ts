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

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

// ──────────────────────────────────────────────
// Hero Slides
// ──────────────────────────────────────────────

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  return apiFetch<HeroSlide[]>("/hero-slides");
}
