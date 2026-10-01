"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types";
import { SHOP_LINKS } from "@/lib/nav";

// Desktop has room for Home; About lives in the footer.
const LINKS = [{ label: "Home", href: "/" }, ...SHOP_LINKS.filter((l) => l.label !== "About")];

export default function Navigation() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error("Navigation fetch error:", err));
  }, []);

  // Close on Escape (back to the button) and on clicks outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <nav aria-label="Main" className="relative z-40 hidden text-black md:block">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4">
        <div
          ref={menuRef}
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          // Keyboard users tabbing out of the list close it.
          onBlur={(e) => {
            if (!menuRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
          }}
        >
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="category-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-[51px] w-[220px] items-center gap-2.5 rounded-t-[5px] bg-[#8a6452] px-5 text-[13px] font-semibold tracking-wide text-white"
          >
            <Grid3x3 size={16} aria-hidden />
            Categories
            <ChevronDown size={14} aria-hidden className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && categories.length > 0 && (
            <ul
              id="category-menu"
              className="absolute left-0 top-full z-[200] w-[220px] rounded-b border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="block border-b border-[#f5f5f5] px-[18px] py-2.5 text-[13px] text-[#1a1a1a] transition-all hover:pl-6 hover:text-[#8a6452] focus-visible:pl-6 focus-visible:text-[#8a6452]"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ul className="flex flex-1 items-center gap-6">
          {LINKS.map((item) => {
            const current = item.href === pathname;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`flex h-[51px] items-center whitespace-nowrap text-[13px] font-medium tracking-wide transition-colors hover:text-[#8a6452] ${
                    current ? "text-[#8a6452]" : "text-black"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="w-[260px] text-xs text-[#6b6b6b]">Nationwide delivery · Pay on delivery available</p>
      </div>
    </nav>
  );
}
