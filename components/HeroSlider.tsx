"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchHeroSlides, fetchCategories } from "@/lib/api";
import type { HeroSlide, Category } from "@/types";

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredPromo, setHoveredPromo] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchHeroSlides(), fetchCategories()])
      .then(([slidesData, catsData]) => {
        setSlides(slidesData);
        setCats(catsData);
      })
      .catch((err) => console.error("HeroSlider fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || slides.length === 0) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning, slides.length]
  );

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  // Skeleton while loading
  if (loading) {
    return (
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          gap: "25px",
          marginBottom: "30px",
        }}
      >
        <div className="hidden lg:block w-[220px] shrink-0 bg-[#f5f5f5] rounded-[5px] animate-pulse" style={{ minHeight: "420px" }} />
        <div className="flex-1 bg-[#f0ece6] rounded-[5px] animate-pulse" style={{ minHeight: "420px" }} />
        <div className="hidden lg:flex flex-col gap-5 w-[260px] shrink-0">
          <div className="flex-1 bg-[#f5f5f5] rounded-[5px] animate-pulse" />
          <div className="flex-1 bg-[#f5f5f5] rounded-[5px] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 16px",
        display: "flex",
        gap: "25px",
        marginBottom: "30px",

      }}
    >
      {/* ─── Left: Category Sidebar ─── */}
      <div className="hidden lg:block w-[220px] shrink-0 border border-t-0 border-[#e8e8e8] bg-white overflow-y-auto rounded-b-[5px]">
        {cats.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 20px",
              color: hoveredCat === cat.id ? "#b88d7a" : "#333",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 400,
              transition: "color 0.15s, padding-left 0.15s",
              paddingLeft: hoveredCat === cat.id ? "22px" : "18px",
              lineHeight: "1.4",
            }}
            onMouseEnter={() => setHoveredCat(cat.id)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            <span>{cat.name}</span>
            {cat.children && cat.children.length > 0 && (
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
      <div className="flex-1 relative overflow-hidden bg-[#f0ece6] min-h-[300px] sm:min-h-[420px] rounded-[5px]">
        {/* Slides */}
        {slides.map((s, i) => (
          <Link href={s.href || "/products"} key={s.id}>
            <div
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
                  backgroundImage: `url(${s.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Content Overlay */}
              <div
              className="absolute inset-0 flex items-center pl-[50px]"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "50px"
                }}
              >
                <div className="px-5 sm:px-22 max-w-[500px]">
                  <div
                    style={{
                      opacity: i === current ? 1 : 0,
                      transform:
                        i === current ? "translateY(0)" : "translateY(20px)",
                      transition:
                        "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
                    }}
                  >
               
                    
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Dot Indicators */}
        {slides.length > 1 && (
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
            {slides.map((_, i) => (
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
        )}
      </div>

      {/* ─── Right: Promo Banners ─── */}
      <div className="hidden lg:flex flex-col gap-5 w-[260px] shrink-0">
        {/* Top Promo Card */}
        <Link
          className="rounded-[5px]"
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
          className="rounded-[5px]"
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
