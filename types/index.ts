// ──────────────────────────────────────────────
// Product (matches API response shape)
// ──────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category: string | null;       // category name for display
  categorySlug?: string | null;
  rating: number;
  reviewCount: number;
  badge?: "sale" | "new" | "hot" | null;
  discount?: number | null;
  // Detail page fields
  description?: string | null;
  sku?: string | null;
  brand?: string | null;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  // From API detail endpoint
  images?: ProductImage[];
  variants?: ProductVariant[];
  categoryObj?: { id: string; name: string; slug: string } | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stockQuantity: number;
  priceOverride: number | null;
}

// ──────────────────────────────────────────────
// Category
// ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  displayOrder?: number;
  productCount?: number;
  children?: Category[];
}

// ──────────────────────────────────────────────
// Seed Types (for data/index.ts and lib/db/seed.ts)
// ──────────────────────────────────────────────

export interface SeedCategory {
  id: number;
  name: string;
  slug: string;
}

export interface SeedProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  badge?: "sale" | "new" | "hot";
  discount?: number;
  description?: string;
  sku?: string;
  brand?: string;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  images?: string[];
  inStock?: boolean;
}

export interface SeedHeroSlide {
  id: number;
  category: string;
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
  href: string;
}

// ──────────────────────────────────────────────
// Nav / UI Types
// ──────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  children?: NavDropdownItem[];
}

export interface NavDropdownItem {
  label: string;
  href: string;
}

export interface Announcement {
  id: number;
  text: string;
  bold: string;
  linkText: string;
  href: string;
}

// ──────────────────────────────────────────────
// Hero Slides (matches DB shape)
// ──────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  boldText: string | null;
  regularText: string | null;
  linkText: string | null;
  href: string | null;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

// Legacy hero slide shape (for static fallback)
export interface LegacyHeroSlide {
  id: number;
  category: string;
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
  href: string;
}

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────

export interface CartItem {
  id: string;              // cart item row id
  productId: string;
  productName: string | null;
  productSlug: string | null;
  productInStock: boolean | null;
  image: string | null;
  variantId: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  guestToken: string | null;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}
