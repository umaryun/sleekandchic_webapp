"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const prev = () => {
    goTo((current - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = heroSlides[current];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#f0ece6",
      }}
    >
      {/* Slides */}
      <div
        style={{
          position: "relative",
          height: "480px",
          overflow: "hidden",
        }}
      >
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
              }}
            >
              <div
                style={{
                  maxWidth: "1280px",
                  width: "100%",
                  margin: "0 auto",
                  padding: "0 60px",
                }}
              >
                <div
                  style={{
                    maxWidth: "520px",
                    opacity: i === current ? 1 : 0,
                    transform: i === current ? "translateX(0)" : "translateX(-30px)",
                    transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
                  }}
                >
                  {/* Category tag */}
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {s.category}
                  </div>

                  {/* Headline */}
                  <h1
                    style={{
                      fontSize: "54px",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: "#1a1a1a",
                      marginBottom: "8px",
                    }}
                  >
                    {s.title}
                    <br />
                    <span style={{ color: "#f57224" }}>{s.highlight}</span>
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: "18px",
                      color: "#555",
                      marginBottom: "32px",
                      fontWeight: 300,
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
                      padding: "14px 32px",
                      background: "#1a1a1a",
                      color: "#fff",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                      borderRadius: "2px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f57224")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                  >
                    Shop Now
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next Arrows */}
      <button
        onClick={prev}
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          color: "#1a1a1a",
          zIndex: 10,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f57224";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)";
          (e.currentTarget as HTMLButtonElement).style.color = "#1a1a1a";
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={next}
        style={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          color: "#1a1a1a",
          zIndex: 10,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f57224";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)";
          (e.currentTarget as HTMLButtonElement).style.color = "#1a1a1a";
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot Indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 10,
        }}
      >
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? "28px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i === current ? "#f57224" : "rgba(255,255,255,0.7)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
