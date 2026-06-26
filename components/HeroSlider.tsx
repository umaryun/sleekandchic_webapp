"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { heroSlides, categories } from "@/data";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [hoveredPromo, setHoveredPromo] = useState<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % heroSlides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 16px",
        display: "flex",
        gap: "0",
      }}
    >
      {/* ─── Left: Category Sidebar ─── */}
      <div
        style={{
          width: "220px",
          minWidth: "220px",
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderTop: "none",
          flexShrink: 0,
          overflowY: "auto",
        }}

      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 18px",
              color: hoveredCat === cat.id ? "#b88d7a" : "#333",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 400,
              // borderBottom: "1px solid #f5f5f5",
              transition: "color 0.15s, padding-left 0.15s",
              paddingLeft: hoveredCat === cat.id ? "22px" : "18px",
              lineHeight: "1.4",
            }}
            onMouseEnter={() => setHoveredCat(cat.id)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            <span>{cat.name}</span>
            {cat.children && (
              <ChevronRight
                size={12}
                style={{
                  color: hoveredCat === cat.id ? "#b88d7a" : "#bbb",
                  transition: "color 0.15s",
                }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* ─── Center: Main Slider ─── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: "#f0ece6",
          minHeight: "420px",
        }}
      >
        {/* Slides */}
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.6s ease",
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            {/* Background Image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${s.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Content Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                background:
                  "linear-gradient(90deg, rgba(240,236,230,0.95) 0%, rgba(240,236,230,0.85) 40%, rgba(240,236,230,0.4) 70%, rgba(240,236,230,0.1) 100%)",
              }}
            >
              <div
                style={{
                  padding: "0 50px",
                  maxWidth: "500px",
                }}
              >
                <div
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform:
                      i === current ? "translateY(0)" : "translateY(20px)",
                    transition:
                      "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
                  }}
                >
                  {/* Category tag */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#b88d7a",
                      fontWeight: 500,
                      marginBottom: "10px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {s.category}
                  </div>

                  {/* Headline */}
                  <h1
                    style={{
                      fontSize: "42px",
                      fontWeight: 400,
                      lineHeight: 1.15,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {s.title}
                    <span
                      style={{
                        color: "#b88d7a",
                        fontWeight: 400,
                        fontStyle: "italic",
                      }}
                    >
                      {s.highlight}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: "36px",
                      color: "#1a1a1a",
                      marginBottom: "28px",
                      fontWeight: 400,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.subtitle}
                  </p>

                  {/* CTA Button */}
                  <Link
                    href={s.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 28px",
                      background: "#1a1a1a",
                      color: "#fff",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: "13px",
                      letterSpacing: "0.5px",
                      border: "2px solid #1a1a1a",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#1a1a1a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1a1a1a";
                      e.currentTarget.style.color = "#fff";
                    }}
                  >
                    Shop Now
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dot Indicators */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "6px",
            zIndex: 10,
          }}
        >
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? "24px" : "8px",
                height: "4px",
                borderRadius: "2px",
                background: i === current ? "#b88d7a" : "rgba(0,0,0,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ─── Right: Promo Banners ─── */}
      <div
        style={{
          width: "260px",
          minWidth: "260px",
          display: "flex",
          flexDirection: "column",
          gap: "0",
          flexShrink: 0,
        }}
      >
        {/* Top Promo Card */}
        <Link
          href="/products"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            textDecoration: "none",
            display: "block",
          }}
          onMouseEnter={() => setHoveredPromo(1)}
          onMouseLeave={() => setHoveredPromo(null)}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/promo-card-1.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "transform 0.4s ease",
              transform: hoveredPromo === 1 ? "scale(1.05)" : "scale(1)",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "24px 20px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.3,
                margin: 0,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              New Modern &amp; Stylist
              <br />
              Crafts
            </h3>
          </div>
        </Link>

        {/* Bottom Promo Card */}
        <Link
          href="/products"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            textDecoration: "none",
            display: "block",
          }}
          onMouseEnter={() => setHoveredPromo(2)}
          onMouseLeave={() => setHoveredPromo(null)}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/promo-card-2.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "transform 0.4s ease",
              transform: hoveredPromo === 2 ? "scale(1.05)" : "scale(1)",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "24px 20px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.3,
                margin: 0,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              Popular Energy with our
              <br />
              newest collection
            </h3>
          </div>
        </Link>
      </div>
    </section>
  );
}
