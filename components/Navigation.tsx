"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { navItems, categories } from "@/data";

export default function Navigation() {
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [catMenuOpen, setCatMenuOpen] = useState(false);

  return (
    <nav
      style={{
        background: "#1a1a1a",
        position: "relative",
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "stretch",
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
              height: "48px",
              background: "#b88d7a",
              border: "none",
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
        </div>

        {/* Main Nav Items */}
        <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
          {navItems.map((item) => (
            <div
              key={item.label}
              style={{ position: "relative" }}
              onMouseEnter={() => setActiveNav(item.label)}
              onMouseLeave={() => setActiveNav(null)}
            >
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "0 16px",
                  height: "48px",
                  color: activeNav === item.label ? "#b88d7a" : "#fff",
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

        {/* Right: Promo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            paddingLeft: "20px",
          }}
        >
          <span style={{ color: "#888", fontSize: "12px" }}>
            🔥 <span style={{ color: "#b88d7a", fontWeight: 600 }}>Hot Deal</span>
            <span style={{ color: "#ccc" }}> — Free Shipping Over $100</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
