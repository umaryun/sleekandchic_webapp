"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types";

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Shop",
    href: "/products",
    children: [
      { label: "Shop Grid", href: "/products" },
      { label: "Shop List", href: "/products?layout=list" },
      { label: "Store Location", href: "/store-locator" },
      { label: "Cart", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    label: "Pages",
    href: "#",
    children: [
      { label: "Order Tracking", href: "/orders/tracking" },
      { label: "About", href: "/about" },
      { label: "Sign up", href: "/register" },
      { label: "Login", href: "/login" },
      { label: "Coming soon", href: "/coming-soon" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Navigation fetch error:", err));
  }, []);

  return (
    <nav className="hidden md:block relative z-40 text-black">
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          justifyContent: "space-between",
          gap: "25px",
          
        }}
      >
        {/* All Categories Mega Dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setCatMenuOpen(true)}
          onMouseLeave={() => setCatMenuOpen(false)}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 20px",
              width: "220px",
              height: "51px",
              background: "#b88d7a",
              borderRadius: "5px 5px 0 0",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              whiteSpace: "nowrap",
              letterSpacing: "0.3px",
            }}
          >
            <Grid3x3 size={16} />
            Categories
            <ChevronDown
              size={14}
            />
          </button>

          {/* Categories dropdown */}
          {catMenuOpen && categories.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: "0 0 4px 4px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                width: "220px",
                zIndex: 200,
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  style={{
                    display: "block",
                    padding: "10px 18px",
                    color: "#1a1a1a",
                    textDecoration: "none",
                    fontSize: "13px",
                    borderBottom: "1px solid #f5f5f5",
                    transition: "background 0.15s, color 0.15s, padding-left 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#b88d7a";
                    e.currentTarget.style.paddingLeft = "24px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#1a1a1a";
                    e.currentTarget.style.paddingLeft = "18px";
                  }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Main Nav Items */}
        <div className="w-[58%]">
          <div className="flex gap-5 items-center">
            {navItems.map((item) => (
              <div
              className=""
                key={item.label}
                style={{ position: "relative" }}
                onMouseEnter={() => setActiveNav(item.label)}
                onMouseLeave={() => setActiveNav(null)}
              >
                <Link
                className="flex items-center gap-[10px] pr-[16px]"
                  href={item.href}
                  style={{
                    height: "51px",
                    color: activeNav === item.label ? "#b88d7a" : "#000",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                    letterSpacing: "0.2px",
                  }}
                >
                  {item.label}
                  {item.children && <ChevronDown size={12} />}
                </Link>

                {item.children && activeNav === item.label && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "0 0 4px 4px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      minWidth: "200px",
                      zIndex: 200,
                    }}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        style={{
                          display: "block",
                          padding: "10px 18px",
                          color: "#1a1a1a",
                          textDecoration: "none",
                          fontSize: "13px",
                          borderBottom: "1px solid #f5f5f5",
                          transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#b88d7a";
                          e.currentTarget.style.paddingLeft = "24px";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#1a1a1a";
                          e.currentTarget.style.paddingLeft = "18px";
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>  
        </div>
        

        {/* Right: Promo text */}
        <div
        className="flex items-center justify-start w-[260px]"
        >
          <span style={{ color: "#888", fontSize: "12px" }}>
            🔥 <span style={{ color: "#b88d7a", fontWeight: 600 }}>Hot Deal</span>
            <span style={{ color: "#ccc" }}> — Free Shipping Over ₦100,000</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
