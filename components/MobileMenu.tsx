"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types";
import { useSession, signOut } from "@/lib/auth-client";
import { useDialog } from "@/lib/hooks/use-dialog";
import Image from "next/image";

const LINKS = [
  { label: "Shop all", href: "/products" },
  { label: "Sale", href: "/products?sale=1" },
  { label: "Track order", href: "/orders/tracking" },
  { label: "Help & FAQs", href: "/help" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  useDialog(isOpen, onClose, panelRef);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("MobileMenu categories fetch error:", err));
  }, []);

  const handleLogout = async () => {
    await signOut();
    onClose();
    router.push("/");
  };

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!isOpen}
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
        <Image src="/logo.png" alt="Sleekandchic" width={120} height={61} className="h-auto w-[120px]" />
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

      <Link
        href={"/"}
        onClick={onClose}
        style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            background: catOpen ? "#f6efe9" : "transparent",
            border: "none",
            borderBottom: "1px solid #f0f0f0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a1a1a",
        }}
      >
        Home
      </Link>
      
      {/* Categories */}
      <div style={{ padding: "0 0 8px" }}>
        <button
          type="button"
          onClick={() => setCatOpen(!catOpen)}
          aria-expanded={catOpen}
          aria-controls="mobile-categories"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            background: catOpen ? "#f6efe9" : "transparent",
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
          <div id="mobile-categories" style={{ background: "#fafafa" }}>
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
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <nav aria-label="Menu" style={{ flex: 1 }}>
        <ul>
          {LINKS.map((item) => (
            <li key={item.label} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <Link
                href={item.href}
                onClick={onClose}
                style={{
                  display: "block",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
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
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
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
              My Account
            </Link>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px",
                background: "#8a6452",
                color: "#fff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
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
                background: "#8a6452",
                color: "#fff",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "2px",
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
