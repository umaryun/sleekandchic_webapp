"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", agree: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { alert("Passwords do not match"); return; }
    alert("Registration submitted (demo only)");
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1px solid #ddd", borderRadius: "3px",
    fontSize: "14px", outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 600 as const, color: "#1a1a1a", marginBottom: "7px" };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Sign Up" crumbs={[]} />
      <section style={{
        maxWidth: "1280px", margin: "48px auto", padding: "0 16px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0",
        borderRadius: "8px", overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.1)", minHeight: "560px",
      }}>
        {/* Left Banner */}
        <div style={{
          background: "linear-gradient(135deg,#f57224 0%,#e06010 100%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "56px 48px", position: "relative", overflow: "hidden",
        }}>
          {[240, 180, 120].map((size, i) => (
            <div key={i} style={{
              position: "absolute", width: size, height: size,
              borderRadius: "50%", border: `${32 - i * 8}px solid rgba(255,255,255,${0.06 + i * 0.02})`,
              right: -size / 3, bottom: -size / 3,
            }} />
          ))}
          <div style={{
            width: "180px", height: "180px", borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            backgroundImage: "url(https://placehold.co/180x180/f57224/fff?text=Join+Us)",
            backgroundSize: "cover", marginBottom: "28px",
          }} />
          <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: 800, marginBottom: "12px", textAlign: "center" }}>
            Join Ninico Today!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", textAlign: "center", lineHeight: 1.7, maxWidth: "280px" }}>
            Create an account to enjoy exclusive deals, track your orders, and save your wishlist.
          </p>
          <div style={{ marginTop: "28px" }}>
            <Link href="/login" style={{
              padding: "10px 28px", background: "rgba(255,255,255,0.15)",
              color: "#fff", textDecoration: "none", borderRadius: "2px",
              fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.3)",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.15)")}
            >
              Already have an account?
            </Link>
          </div>
        </div>

        {/* Right Form */}
        <div style={{ background: "#fff", padding: "48px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "6px" }}>Create your account</h3>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>
            Fill in the form below to get started with Ninico.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: "#f57224" }}>*</span></label>
              <input type="text" required placeholder="John Doe" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email <span style={{ color: "#f57224" }}>*</span></label>
              <input type="email" required placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" placeholder="+1 (000) 000-0000" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password <span style={{ color: "#f57224" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input type={showPwd ? "text" : "password"} required placeholder="Min. 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label style={labelStyle}>Confirm Password <span style={{ color: "#f57224" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input type={showConfirm ? "text" : "password"} required placeholder="Re-enter password" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#555" }}>
              <input type="checkbox" required checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                style={{ accentColor: "#f57224", width: "15px", height: "15px", marginTop: "1px", flexShrink: 0 }}
              />
              I agree to the{" "}
              <Link href="/terms" style={{ color: "#f57224", textDecoration: "none", fontWeight: 500 }}>Terms & Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy-policy" style={{ color: "#f57224", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</Link>
            </label>

            <button type="submit" style={{
              padding: "13px", background: "#f57224", color: "#fff",
              border: "none", borderRadius: "3px", cursor: "pointer",
              fontWeight: 700, fontSize: "14px", letterSpacing: "0.5px",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e06010")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
            >
              Create Account
            </button>
          </form>

          <p style={{ marginTop: "18px", fontSize: "13px", color: "#888", textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#f57224", fontWeight: 600, textDecoration: "none" }}>Login</Link>
          </p>
        </div>
      </section>
    </ShopLayout>
  );
}
