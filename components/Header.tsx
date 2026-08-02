"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  GitCompare,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types";
import CartDrawer from "./CartDrawer";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  compareCount: number;
}


export default function Header({ compareCount }: HeaderProps) {
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Header categories fetch error:", err));
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header
        className=""
        style={{
          background: "#fff",
          marginBottom: "10px",
          marginTop: "10px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="justify-between"
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
          className="block md:hidden bg-none border-none cursor-pointer text-[#1a1a1a] p-1"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link className="" href="/" style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Slickandchic"
            className="w-[160px] md:w-[190px]"
          />
        </Link>

        {/* Mobile action buttons */}
        <div className="flex md:hidden items-center gap-4 ml-auto">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="bg-none border-none cursor-pointer text-[#1a1a1a] p-1"
            aria-label="Toggle search"
          >
            <Search size={22} />
          </button>
          {/* Mobile Cart Toggle */}
          <button
            onClick={() => setCartOpen(true)}
            className="bg-none border-none cursor-pointer text-[#1a1a1a] p-1 relative"
            aria-label="Open cart"
          >
            <ShoppingCart size={22} />
            <span
              className="absolute -top-1.5 -right-2 bg-[#b88d7a] text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold"
            >
              {cartCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="hidden md:flex flex-1 rounded-[5px] max-w-[780px] overflow-hidden"
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
                  background: "#F3F4F7",
                  border: "none",
                  borderRight: "1px solid #e4e4e4",
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
                  {["All Categories", ...categories.map((c: Category) => c.name)].map((cat) => (
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
                background: "#F3F4F7",
              }}
            />

            {/* Search Button */}
            <button
              style={{
                padding: "0 18px",
                background: "#F3F4F7",
                border: "none",
                cursor: "pointer",
                color: "#000",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Action Icons */}
          <div className="hidden md:flex items-center gap-5 ml-auto shrink-0">
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

        {/* Mobile Search Input Row */}
        {searchOpen && (
          <div className="md:hidden border-t border-[#e5e5e5] px-4 py-2.5 bg-white">
            <div className="flex border border-[#1a1a1a] rounded overflow-hidden">
              <input
                type="text"
                placeholder="What Are You Looking For?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none bg-white text-[#1a1a1a]"
              />
              <button
                className="bg-[#1a1a1a] text-white px-4 flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Search CSS Cleanups */}
        <style>{`
          @media (max-width: 768px) {
            .mobile-hamburger { display: flex !important; }
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
