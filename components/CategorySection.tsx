"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types";

const categoryIconMap: Record<string, string> = {
  abayas: "/abayas.png",
  bubu: "/bubu.png",
  kaftan: "/kaftans.png",
  dresses: "/dresses.png",
  gowns: "/gowns.png",
  "two-piece": "/two-piece.png",
};

// SVG data URI for fallback image when no icon exists
const svgFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23b88d7a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'/%3E%3Cline x1='3' y1='6' x2='21' y2='6'/%3E%3Cpath d='M16 10a4 4 0 0 1-8 0'/%3E%3C/svg%3E";

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.slice(0, 6)))
      .catch((err) => console.error("CategorySection fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section
        className="hidden sm:block"
        style={{
          maxWidth: "1280px",
          margin: "50px auto",
          padding: "0 16px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            Top{" "}
            <span style={{ color: "#b88d7a", fontStyle: "italic" }}>
              Categories
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                padding: "20px 10px 16px",
                background: "#fff",
                borderRadius: "4px",
              }}
            >
              <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#f0f0f0] animate-pulse" />
              <div style={{ width: "60px", height: "12px", background: "#f0f0f0", borderRadius: "4px" }} className="animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section
    className="hidden sm:block"
      style={{
        maxWidth: "1280px",
        margin: "50px auto",
        padding: "0 16px",
      }}
    >
      {/* Section Header */}
      <div
      className=""
        style={{
          marginBottom: "10px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.2,
          }}
        >
          Top{" "}
          <span style={{ color: "#b88d7a", fontStyle: "italic" }}>
            Categories
          </span>
        </h2>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
        {categories.map((cat) => {
          const iconSrc = cat.iconUrl || categoryIconMap[cat.slug] || `/${cat.slug}.png`;
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
                padding: "20px 10px 16px",
                background: "#fff",
                borderRadius: "4px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#b88d7a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#f0f0f0";
              }}
            >
              <div style={{ position: "relative" }}>
                <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconSrc}
                    alt={cat.name}
                    className="w-10 h-10 sm:w-[55px] sm:h-[55px] object-contain"
                    onError={(e) => {
                      // Prevent infinite error loop if fallback fails
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = svgFallback;
                    }}
                  />
                </div>

                {/* Count Badge */}
                <span
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#b88d7a",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {cat.productCount ?? 0}
                </span>
              </div>

              {/* Name */}
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1a1a1a",
                  textAlign: "center",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {cat.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
