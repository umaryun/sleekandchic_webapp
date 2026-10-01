/** Main shop links, shared by the desktop navigation and the mobile menu. */
export const SHOP_LINKS = [
  { label: "Shop all", href: "/products" },
  { label: "Sale", href: "/products?sale=1" },
  { label: "Track order", href: "/orders/tracking" },
  { label: "Help", href: "/help" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
