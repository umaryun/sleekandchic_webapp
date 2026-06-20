"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";

const QUICK_LINKS = [
  { label: "Shop All Products", href: "/products", Icon: ShoppingBag },
  { label: "Browse Categories", href: "/products", Icon: Search },
  { label: "Contact Support", href: "/contact", Icon: Home },
];

export default function NotFound() {
  return (
    <ShopLayout>
      <div style={{ minHeight: "calc(100vh - 300px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 16px", textAlign: "center" }}>
        {/* Big 404 */}
        <div style={{ position: "relative", marginBottom: "32px" }}>
          <span style={{ fontSize: "clamp(100px, 20vw, 180px)", fontWeight: 900, color: "#f0f0f0", lineHeight: 1, display: "block", letterSpacing: "-4px", userSelect: "none" }}>
            404
          </span>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f57224, #e06010)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(245,114,36,0.3)" }}>
              <Search size={32} color="#fff" />
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>
          Oops! Page Not Found
        </h1>
        <p style={{ fontSize: "15px", color: "#888", lineHeight: 1.8, maxWidth: "480px", marginBottom: "36px" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Don&apos;t worry — let&apos;s get you back on track.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "56px" }}>
          <Link href="/" style={{ padding: "13px 28px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#e06010")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f57224")}
          >
            <Home size={16} /> Go Home
          </Link>
          <Link href="/products" style={{ padding: "13px 28px", border: "2px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a"; }}
          >
            <ShoppingBag size={16} /> Shop Now
          </Link>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", borderTop: "1px solid #f0f0f0", paddingTop: "40px", maxWidth: "400px", width: "100%" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>
            Or try these popular pages
          </p>
          {QUICK_LINKS.map(({ label, href, Icon }) => (
            <Link key={label} href={href}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 20px", width: "100%", borderRadius: "6px", color: "#555", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "background 0.15s, color 0.15s", borderBottom: "1px solid #f5f5f5" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#fff8f5"; (e.currentTarget as HTMLAnchorElement).style.color = "#f57224"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#555"; }}
            >
              <Icon size={16} />
              {label}
              <ArrowLeft size={14} style={{ marginLeft: "auto", transform: "rotate(180deg)" }} />
            </Link>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
