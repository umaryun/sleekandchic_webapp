"use client";

import Link from "next/link";
import { Home, Grid3x3, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const NAV_ITEMS = [
  { href: "/", Icon: Home, label: "Home" },
  { href: "/products", Icon: Grid3x3, label: "Shop" },
  { href: "/cart", Icon: ShoppingCart, label: "Bag" },
  { href: "/profile", Icon: User, label: "Account" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    <>
      <nav
        aria-label="Shop"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[#e5e5e5] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden"
      >
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-[3px] py-2.5 text-[10px] transition-colors ${active ? "font-semibold text-[#8a6452]" : "text-[#6b6b6b]"}`}
            >
              <span className="relative">
                <Icon size={20} aria-hidden />
                {href === "/cart" && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8a6452] px-1 text-[10px] font-bold text-white">
                    {cartCount}
                    <span className="sr-only"> in your bag</span>
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      {/* Room at the bottom of every page for the bar. */}
      <style>{`@media (max-width: 767px) { body { padding-bottom: calc(60px + env(safe-area-inset-bottom)); } }`}</style>
    </>
  );
}
