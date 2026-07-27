"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, ChevronRight } from "lucide-react";
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

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("MobileMenu categories fetch error:", err));
  }, []);

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "300px",
        height: "100vh",
        background: "#fff",
        zIndex: 60,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 800 }}>
          <span style={{ color: "#1a1a1a" }}>Nin</span>
          <span style={{ color: "#b88d7a" }}>ico</span>
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
          }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Categories */}
      <div style={{ padding: "0 0 8px" }}>
        <button
          onClick={() => setCatOpen(!catOpen)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            background: catOpen ? "#fff3ec" : "transparent",
            border: "none",
            borderBottom: "1px solid #f0f0f0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a1a1a",
          }}
        >
          All Categories
          <ChevronDown
            size={16}
            style={{
              transform: catOpen ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {catOpen && (
          <div style={{ background: "#fafafa" }}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 20px 11px 32px",
                  color: "#555",
                  textDecoration: "none",
                  fontSize: "13px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <ChevronRight size={12} color="#b88d7a" />
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <div key={item.label} style={{ borderBottom: "1px solid #f0f0f0" }}>
            <button
              onClick={() =>
                setOpenSection(openSection === item.label ? null : item.label)
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1a1a1a",
                textAlign: "left",
              }}
            >
              {item.label}
              {item.children && (
                <ChevronDown
                  size={16}
                  style={{
                    transform:
                      openSection === item.label ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
            {item.children && openSection === item.label && (
              <div style={{ background: "#fafafa", paddingBottom: "4px" }}>
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px 10px 32px",
                      color: "#666",
                      textDecoration: "none",
                      fontSize: "13px",
                    }}
                  >
                    <ChevronRight size={12} color="#ccc" />
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer links */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          gap: "12px",
        }}
      >
        <Link
          href="/login"
          onClick={onClose}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "10px",
            border: "1px solid #1a1a1a",
            color: "#1a1a1a",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "2px",
          }}
        >
          Login
        </Link>
        <Link
          href="/register"
          onClick={onClose}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "10px",
            background: "#b88d7a",
            color: "#fff",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "2px",
          }}
        >
          Register
        </Link>
      </div>
    </aside>
  );
}
