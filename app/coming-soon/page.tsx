"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";

const LAUNCH_DATE = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

export default function ComingSoonPage() {
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const pad = (n: number) => String(n).padStart(2, "0");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", position: "relative", overflow: "hidden" }}>
      {/* Decorative background rings */}
      {[500, 700, 900].map((size, i) => (
        <div key={i} style={{ position: "absolute", width: size, height: size, borderRadius: "50%", border: `${40 - i * 10}px solid rgba(245,114,36,${0.03 + i * 0.01})`, left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      ))}
      {/* Glow dots */}
      <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,114,36,0.12) 0%, transparent 70%)", top: "10%", right: "15%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,114,36,0.08) 0%, transparent 70%)", bottom: "15%", left: "10%", pointerEvents: "none" }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: "48px", position: "relative" }}>
        <span style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-1px" }}>
          <span style={{ color: "#fff" }}>Nin</span>
          <span style={{ color: "#f57224" }}>ico</span>
        </span>
      </Link>

      {/* Badge */}
      <div style={{ padding: "6px 20px", background: "rgba(245,114,36,0.15)", border: "1px solid rgba(245,114,36,0.3)", borderRadius: "20px", marginBottom: "24px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#f57224", letterSpacing: "2px", textTransform: "uppercase" }}>Something Amazing is Coming</span>
      </div>

      {/* Headline */}
      <h1 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.15, marginBottom: "16px", maxWidth: "720px" }}>
        We&rsquo;re Working on Something
        <span style={{ color: "#f57224" }}> Extraordinary</span>
      </h1>
      <p style={{ fontSize: "16px", color: "#888", textAlign: "center", lineHeight: 1.8, maxWidth: "540px", marginBottom: "56px" }}>
        Our new collection drops soon. Sign up to be the first to know — and get an exclusive <strong style={{ color: "#f57224" }}>20% off</strong> on launch day.
      </p>

      {/* Countdown */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "56px", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { value: days, label: "Days" },
          { value: hours, label: "Hours" },
          { value: minutes, label: "Minutes" },
          { value: seconds, label: "Seconds" },
        ].map(({ value, label }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100px", height: "100px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {/* Inner glow */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)" }} />
                <span style={{ fontSize: "40px", fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", position: "relative", zIndex: 1 }}>
                  {pad(value)}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#666", marginTop: "10px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
                {label}
              </span>
            </div>
            {i < 3 && (
              <span style={{ fontSize: "32px", fontWeight: 900, color: "rgba(245,114,36,0.5)", marginBottom: "22px" }}>:</span>
            )}
          </div>
        ))}
      </div>

      {/* Email form */}
      {subscribed ? (
        <div style={{ padding: "20px 32px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "18px", marginBottom: "6px" }}>🎉</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>You&rsquo;re on the list!</p>
          <p style={{ fontSize: "13px", color: "#888" }}>We&rsquo;ll notify you the moment we launch.</p>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} style={{ display: "flex", maxWidth: "480px", width: "100%", marginBottom: "40px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", borderRadius: "6px", overflow: "hidden" }}>
          <input
            type="email" required placeholder="Enter your email address..."
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, padding: "16px 20px", border: "none", fontSize: "14px", outline: "none", fontFamily: "inherit", background: "rgba(255,255,255,0.95)", color: "#1a1a1a" }}
          />
          <button type="submit" style={{ padding: "0 24px", background: "#f57224", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px", color: "#fff", whiteSpace: "nowrap", transition: "background 0.2s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e06010")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
          >
            <Send size={15} /> Notify Me
          </button>
        </form>
      )}

      {/* Progress bar */}
      <div style={{ maxWidth: "400px", width: "100%", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          <span>Progress</span>
          <span style={{ color: "#f57224", fontWeight: 700 }}>78% Complete</span>
        </div>
        <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "78%", background: "linear-gradient(90deg, #f57224, #ff9500)", borderRadius: "3px" }} />
        </div>
      </div>

      {/* Social links */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "36px" }}>
        {[
          { Icon: Facebook, href: "#", color: "#1877F2" },
          { Icon: Twitter, href: "#", color: "#1da1f2" },
          { Icon: Instagram, href: "#", color: "#E1306C" },
          { Icon: Youtube, href: "#", color: "#FF0000" },
        ].map(({ Icon, href, color }, i) => (
          <a key={i} href={href} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = color; el.style.borderColor = color; el.style.color = "#fff"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "transparent"; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "#888"; }}
          >
            <Icon size={16} />
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#555" }}>
        <Link href="/" style={{ color: "#555", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#555")}
        >Home</Link>
        <Link href="/contact" style={{ color: "#555", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#555")}
        >Contact</Link>
        <Link href="/products" style={{ color: "#555", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#555")}
        >Shop Now</Link>
      </div>
      <p style={{ fontSize: "12px", color: "#444", marginTop: "16px" }}>© {new Date().getFullYear()} Ninico. All rights reserved.</p>
    </div>
  );
}
