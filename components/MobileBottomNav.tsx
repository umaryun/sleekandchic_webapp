"use client";

import Link from "next/link";
import { Home, Grid3x3, Tags, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", Icon: Home, label: "Home" },
    { href: "/products", Icon: Grid3x3, label: "Shop" },
    { href: "/products?sort=newest", Icon: Tags, label: "New In" },
    { href: "/cart", Icon: ShoppingCart, label: "Cart" },
    { href: "/profile", Icon: User, label: "Account" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #e5e5e5",
        display: "flex",
        zIndex: 50,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
      }}
      className="mobile-bottom-nav"
    >
      {navItems.map(({ href, Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0",
              gap: "3px",
              color: isActive ? "#b88d7a" : "#888",
              textDecoration: "none",
              fontSize: "10px",
              transition: "color 0.2s",
            }}
          >
            <Icon size={20} />
            <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}

      <style>{`
        .mobile-bottom-nav { display: none !important; }
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex !important; }
          body { padding-bottom: 60px; }
        }
      `}</style>
    </nav>
  );
}
