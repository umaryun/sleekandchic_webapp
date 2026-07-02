"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Facebook, Youtube, Instagram } from "lucide-react";
import { announcements } from "@/data";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
];

const currencies = ["USD", "EUR", "VND", "NGN"];

// Custom modern X (formerly Twitter) logo path
const XIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(1); // Default to "Trendy 25 silver jewelry..."
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState(languages[0]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % announcements.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, []);

  // Automatic slow transition every 6 seconds to keep it dynamic
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const ann = announcements[current];

  return (
    <header className="w-full relative z-[60] min-h-10 bg-[#F3EEE7]">

      {/* Main Bar with light warm cream background */}
      <div className=" text-black py-5 px-4 min-h-10 flex justify-center">
        <div className="w-[1260px] mx-auto flex items-center justify-between gap-4 text-xs font-semibold select-none">
          
          {/* Left: Announcement Content with Controls */}
          <div className="flex items-center gap-3">
            {/* Minimal Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="hover:text-[#d51243] text-black transition-colors p-0.5"
                aria-label="Previous announcement"
              >
                <ArrowLeft size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={next}
                className="hover:text-[#d51243] text-black transition-colors p-0.5"
                aria-label="Next announcement"
              >
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Announcement text & call to action link */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-black text-[12px] font-bold tracking-tight">
                {ann.bold}{ann.text}
              </span>
              <Link
                href={ann.href}
                className="text-[#d51243] hover:text-[#b88d7a] font-bold underline transition-colors inline-flex items-center gap-0.5 text-[12px]"
              >
                {ann.linkText} →
              </Link>
            </div>
          </div>

          {/* Right: Currency & Language Dropdowns + Social Icons */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setCurrencyOpen(!currencyOpen);
                  setLangOpen(false);
                }}
                className="flex items-center gap-1 hover:text-[#d51243] transition-colors bg-transparent border-none cursor-pointer p-0 text-[12px] font-bold text-black"
              >
                {currency}
                <ChevronDown size={11} strokeWidth={2.5} className="opacity-70" />
              </button>
              
              {currencyOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-[#e5e5e5] rounded shadow-lg z-50 py-1 min-w-[80px]">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrency(c);
                        setCurrencyOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f5f5] ${currency === c ? "text-[#d51243] font-bold" : "text-black"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangOpen(!langOpen);
                  setCurrencyOpen(false);
                }}
                className="flex items-center gap-1.5 hover:text-[#d51243] transition-colors bg-transparent border-none cursor-pointer p-0 text-[12px] font-bold text-black"
              >
                <span className="text-[14px] leading-none">{language.flag}</span>
                <span>{language.label}</span>
                <ChevronDown size={11} strokeWidth={2.5} className="opacity-70" />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-[#e5e5e5] rounded shadow-lg z-50 py-1 min-w-[120px]">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l);
                        setLangOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f5f5] ${language.code === l.code ? "text-[#d51243] font-bold" : "text-black"}`}
                    >
                      <span className="text-[14px]">{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Social Icons Links */}
            <div className="flex items-center gap-4 text-black">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#d51243] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={14} strokeWidth={2} />
              </Link>
              <Link
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#d51243] transition-colors"
                aria-label="X (Twitter)"
              >
                <XIcon className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#d51243] transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={14} strokeWidth={2} />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#d51243] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={14} strokeWidth={2} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
