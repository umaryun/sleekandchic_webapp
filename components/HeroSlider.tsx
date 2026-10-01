"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchHeroSlides, fetchCategories } from "@/lib/api";
import { isSafeHref } from "@/lib/links";
import { STORE } from "@/lib/store";
import type { HeroSlide, Category } from "@/types";

const SLIDE_MS = 6000;

/** Slides saved before links were checked may hold anything; fall back to the shop. */
const slideHref = (s: HeroSlide) => (s.href && isSafeHref(s.href) ? s.href : "/products");

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    Promise.all([fetchHeroSlides(), fetchCategories()])
      .then(([slidesData, catsData]) => {
        setSlides(slidesData);
        setCats(catsData);
      })
      .catch((err) => console.error("HeroSlider fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Advances on its own unless the shopper is pointing at or focused on it,
  // or prefers less motion.
  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused, reducedMotion]);

  if (loading) {
    return (
      <section className="mx-auto mb-8 flex max-w-[1280px] gap-6 px-4" aria-busy="true">
        <div className="hidden w-[220px] shrink-0 animate-pulse rounded-[5px] bg-[#f5f5f5] lg:block" style={{ minHeight: 420 }} />
        <div className="flex-1 animate-pulse rounded-[5px] bg-[#f0ece6]" style={{ minHeight: 420 }} />
      </section>
    );
  }

  return (
    <section className="mx-auto mb-8 flex max-w-[1280px] gap-6 px-4">
      {/* Categories (desktop) */}
      {cats.length > 0 && (
        <nav aria-label="Shop by category" className="hidden w-[220px] shrink-0 overflow-y-auto rounded-b-[5px] border border-t-0 border-[#e8e8e8] bg-white lg:block">
          <ul>
            {cats.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="flex items-center justify-between py-2.5 pl-[18px] pr-5 text-[13.5px] leading-snug text-[#333] transition-all hover:pl-[22px] hover:text-[#b88d7a] focus-visible:pl-[22px] focus-visible:text-[#b88d7a]"
                >
                  <span>{cat.name}</span>
                  {cat.children && cat.children.length > 0 && <ChevronRight size={12} className="text-[#bbb]" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Slides */}
      {slides.length === 0 ? (
        <Link
          href="/products"
          className="flex min-h-[300px] flex-1 flex-col justify-center rounded-[5px] bg-[#f0ece6] px-8 sm:min-h-[420px] sm:px-14"
        >
          <p className="max-w-md font-serif text-3xl leading-tight text-[#2a2420] sm:text-4xl">{STORE.tagline}</p>
          <span className="mt-6 inline-flex w-fit items-center gap-1 rounded-full bg-[#2a2420] px-5 py-2.5 text-sm font-semibold text-white">
            Shop now <ChevronRight size={16} aria-hidden />
          </span>
        </Link>
      ) : (
        <div
          className="relative min-h-[300px] flex-1 overflow-hidden rounded-[5px] bg-[#f0ece6] sm:min-h-[420px]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {slides.map((s, i) => {
            const active = i === current;
            const hasText = Boolean(s.boldText || s.regularText || s.linkText);
            return (
              <Link
                key={s.id}
                href={slideHref(s)}
                aria-hidden={!active}
                tabIndex={active ? 0 : -1}
                aria-label={hasText ? undefined : "Shop the collection"}
                className={`absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none ${
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${s.imageUrl})` }} />
                {hasText && (
                  <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/55 via-black/25 to-transparent px-6 sm:px-14">
                    <div className="max-w-md text-white">
                      {s.boldText && (
                        <h2 className="font-serif text-3xl font-bold leading-tight drop-shadow sm:text-5xl">{s.boldText}</h2>
                      )}
                      {s.regularText && <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">{s.regularText}</p>}
                      {s.linkText && (
                        <span className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#2a2420]">
                          {s.linkText} <ChevronRight size={16} aria-hidden />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}

          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-1 rounded-sm transition-all ${i === current ? "w-6 bg-[#b88d7a]" : "w-2 bg-black/25 hover:bg-black/40"}`}
                  aria-label={`Show slide ${i + 1} of ${slides.length}`}
                  aria-current={i === current}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
