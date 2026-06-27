"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Phone } from "lucide-react";

const currencies = ["USD", "EUR", "VND", "NGN"];
const languages = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ar", label: "Arabic" },
];

export default function TopBar() {
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="hidden md:block bg-[#f5f5f5] border-b border-[#e5e5e5] text-xs py-1.5">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between">
        {/* Left: Currency & Language */}
        <div className="flex items-center gap-3">
          {/* Currency Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "#1a1a1a",
                padding: "2px 0",
              }}
            >
              {currency} <ChevronDown size={12} />
            </button>
            {currencyOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  minWidth: "80px",
                  marginTop: "4px",
                }}
              >
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "12px",
                      color: currency === c ? "#b88d7a" : "#1a1a1a",
                      fontWeight: currency === c ? 600 : 400,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{ color: "#ccc" }}>|</span>

          {/* Language Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "#1a1a1a",
                padding: "2px 0",
              }}
            >
              {language} <ChevronDown size={12} />
            </button>
            {langOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  minWidth: "120px",
                  marginTop: "4px",
                }}
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.label); setLangOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "12px",
                      color: language === l.label ? "#b88d7a" : "#1a1a1a",
                      fontWeight: language === l.label ? 600 : 400,
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Social Links */}
        <div className="flex items-center gap-2.5">
          {[
            { href: "https://www.facebook.com", Icon: Phone, label: "Facebook" },
            { href: "https://x.com", Icon: Phone, label: "X (Twitter)" },
            { href: "https://www.youtube.com", Icon: Phone, label: "YouTube" },
            { href: "https://www.linkedin.com", Icon: Phone, label: "Instagram" },
          ].map(({ href, Icon, label }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              style={{ color: "#666", display: "flex", alignItems: "center" }}
            >
              <Icon size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
