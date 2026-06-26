"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  GitCompare,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import { categories } from "@/data";
import CartDrawer from "./CartDrawer";
import MobileMenu from "./MobileMenu";

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  compareCount: number;
}

export default function Header({ cartCount, wishlistCount, compareCount }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e5e5",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            height: "72px",
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#1a1a1a",
              padding: "4px",
            }}
            className="mobile-hamburger"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#1a1a1a",
                letterSpacing: "-0.5px",
              }}
            >
              <span style={{ color: "#1a1a1a" }}>Slickand</span>
              <span style={{ color: "#b88d7a" }}>chick</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div
            style={{
              flex: 1,
              display: "flex",
              border: "2px solid #1a1a1a",
              borderRadius: "4px",
              overflow: "hidden",
              maxWidth: "680px",
            }}
          >
            {/* Category Selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 14px",
                  background: "#f5f5f5",
                  border: "none",
                  borderRight: "2px solid #1a1a1a",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#1a1a1a",
                  height: "44px",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {selectedCategory.length > 14
                  ? selectedCategory.slice(0, 14) + "..."
                  : selectedCategory}
                <ChevronDown size={14} />
              </button>
              {categoryOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "4px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 200,
                    minWidth: "200px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    marginTop: "2px",
                  }}
                >
                  {["All Categories", ...categories.map((c) => c.name)].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategoryOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        color: selectedCategory === cat ? "#b88d7a" : "#1a1a1a",
                        fontWeight: selectedCategory === cat ? 600 : 400,
                        borderBottom: "1px solid #f5f5f5",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="What Are You Looking For?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "0 14px",
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#1a1a1a",
                background: "#fff",
              }}
            />

            {/* Search Button */}
            <button
              style={{
                padding: "0 18px",
                background: "#1a1a1a",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Action Icons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {/* Compare */}
            <Link
              href="/compare"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#1a1a1a",
                textDecoration: "none",
                position: "relative",
                fontSize: "11px",
                gap: "2px",
              }}
            >
              <div style={{ position: "relative" }}>
                <GitCompare size={22} />
                {compareCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-8px",
                      background: "#b88d7a",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {compareCount}
                  </span>
                )}
              </div>
              <span style={{ color: "#666", fontSize: "11px" }}>Compare</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#1a1a1a",
                textDecoration: "none",
                position: "relative",
                fontSize: "11px",
                gap: "2px",
              }}
            >
              <div style={{ position: "relative" }}>
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-8px",
                      background: "#b88d7a",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span style={{ color: "#666", fontSize: "11px" }}>Wishlist</span>
            </Link>

            {/* Account */}
            <Link
              href="/login"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#1a1a1a",
                textDecoration: "none",
                fontSize: "11px",
                gap: "2px",
              }}
            >
              <User size={22} />
              <span style={{ color: "#666", fontSize: "11px" }}>Account</span>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#1a1a1a",
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
                fontSize: "11px",
                gap: "2px",
              }}
              aria-label="Open cart"
            >
              <div style={{ position: "relative" }}>
                <ShoppingCart size={22} />
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-8px",
                    background: "#b88d7a",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {cartCount}
                </span>
              </div>
              <span style={{ color: "#666", fontSize: "11px" }}>Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <style>{`
          @media (max-width: 768px) {
            .mobile-hamburger { display: flex !important; }
            .desktop-search { display: none !important; }
            .desktop-icons { display: none !important; }
          }
        `}</style>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Backdrop */}
      {(cartOpen || mobileMenuOpen) && (
        <div
          onClick={() => { setCartOpen(false); setMobileMenuOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 49,
          }}
        />
      )}
    </>
  );
}
