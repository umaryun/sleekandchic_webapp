"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Login submitted (demo only)");
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Login" crumbs={[]} />
      <section
        style={{
          maxWidth: "1280px",
          margin: "48px auto",
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(0,0,0,0.1)",
          minHeight: "540px",
        }}
      >
        {/* Left: Banner */}
        <div
          style={{
            background: "linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          {[220, 160, 100].map((size, i) => (
            <div key={i} style={{
              position: "absolute",
              width: size, height: size,
              borderRadius: "50%",
              border: `${30 - i * 8}px solid rgba(245,114,36,${0.06 + i * 0.02})`,
              right: -size / 3, top: -size / 3,
            }} />
          ))}
          <div style={{
            width: "200px", height: "200px", borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            backgroundImage: "url(https://placehold.co/200x200/2a2a2a/555?text=Login)",
            backgroundSize: "cover",
            marginBottom: "32px",
          }} />
          <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: 800, marginBottom: "12px", textAlign: "center" }}>
            Welcome Back!
          </h2>
          <p style={{ color: "#888", fontSize: "14px", textAlign: "center", lineHeight: 1.7, maxWidth: "280px" }}>
            Sign in to your account to access your orders, wishlist, and personalized recommendations.
          </p>
          <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
            <Link href="/register" style={{
              padding: "10px 24px", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", textDecoration: "none", borderRadius: "2px",
              fontSize: "13px", fontWeight: 600,
              transition: "border-color 0.2s",
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f57224")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)")}
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ background: "#fff", padding: "56px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "6px" }}>
            Login to your account
          </h3>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "32px", lineHeight: 1.6 }}>
            Your personal data will be used to support your experience throughout this website, to manage access to your account.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "7px" }}>
                Email <span style={{ color: "#f57224" }}>*</span>
              </label>
              <input
                type="email" required placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%", padding: "11px 14px",
                  border: "1px solid #ddd", borderRadius: "3px",
                  fontSize: "14px", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "7px" }}>
                Password <span style={{ color: "#f57224" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"} required placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: "100%", padding: "11px 44px 11px 14px",
                    border: "1px solid #ddd", borderRadius: "3px",
                    fontSize: "14px", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#aaa",
                  }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#555" }}>
                <input type="checkbox" checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  style={{ accentColor: "#f57224", width: "15px", height: "15px" }}
                />
                Remember me
              </label>
              <Link href="/password/reset" style={{ fontSize: "13px", color: "#f57224", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" style={{
              padding: "13px", background: "#1a1a1a", color: "#fff",
              border: "none", borderRadius: "3px", cursor: "pointer",
              fontWeight: 700, fontSize: "14px", letterSpacing: "0.5px",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")}
            >
              Login
            </button>
          </form>

          <p style={{ marginTop: "20px", fontSize: "13px", color: "#888", textAlign: "center" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#f57224", fontWeight: 600, textDecoration: "none" }}>
              Register now
            </Link>
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#efefef" }} />
            <span style={{ fontSize: "12px", color: "#aaa", whiteSpace: "nowrap" }}>Login with social networks</span>
            <div style={{ flex: 1, height: "1px", background: "#efefef" }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { name: "Facebook", color: "#1877F2", icon: "f" },
              { name: "Google", color: "#DB4437", icon: "G" },
              { name: "GitHub", color: "#24292e", icon: "⌂" },
              { name: "LinkedIn", color: "#0077B5", icon: "in" },
            ].map(({ name, color, icon }) => (
              <button key={name} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 16px", border: "1px solid #e5e5e5",
                borderRadius: "3px", cursor: "pointer", background: "#fff",
                fontSize: "13px", fontWeight: 500, color: "#333",
                transition: "border-color 0.2s, background 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e5e5"; (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
              >
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                  {icon}
                </span>
                Sign in with {name}
              </button>
            ))}
          </div>
        </div>
      </section>
      <style>{`@media(max-width:768px){section{grid-template-columns:1fr!important}.left-banner{display:none!important}}`}</style>
    </ShopLayout>
  );
}
