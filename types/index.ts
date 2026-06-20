export interface Product {
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
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
}

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

export interface HeroSlide {
  id: number;
  category: string;
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
  href: string;
}

export interface CartItem extends Product {
  quantity: number;
}
