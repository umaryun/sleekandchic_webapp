"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: "3px", fontSize: "14px", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit" };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Contact" crumbs={[]} />

      {/* Info cards */}
      <section style={{ background: "#f8f8f8", padding: "48px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { Icon: MapPin, title: "Our Address", lines: ["24/26 Strait Bargate,", "Boston, PE21, United Kingdom"] },
            { Icon: Phone, title: "Phone Number", lines: ["+098 (905) 786 897 8", "Mon–Fri 9am–6pm EST"] },
            { Icon: Mail, title: "Email Address", lines: ["hello@sleekandchic.com", "support@sleekandchic.com"] },
            { Icon: Clock, title: "Store Hours", lines: ["Mon–Fri: 10am–8pm", "Sat–Sun: 10am–6pm"] },
          ].map(({ Icon, title, lines }) => (
            <div key={title} style={{ background: "#fff", padding: "28px 24px", borderRadius: "6px", textAlign: "center", border: "1px solid #f0f0f0", transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fff3ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon size={22} color="#f57224" />
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>{title}</h4>
              {lines.map(l => <p key={l} style={{ fontSize: "13px", color: "#888", lineHeight: 1.6 }}>{l}</p>)}
            </div>
          ))}
        </div>
      </section>

      {/* Form + Map */}
      <section className="max-w-[1280px] mx-auto my-14 px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact form */}
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "36px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", color: "#f57224", textTransform: "uppercase", marginBottom: "8px" }}>Get In Touch</p>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a1a", marginBottom: "6px" }}>Make Custom Request</h2>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "28px", lineHeight: 1.7 }}>
            Must-have pieces selected every month — want style ideas, personalized recommendations, or just want to say hello?
          </p>

          {sent ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f0faf5", borderRadius: "6px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>Message Sent!</h3>
              <p style={{ color: "#666", fontSize: "14px" }}>Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <button onClick={() => setSent(false)} style={{ marginTop: "20px", padding: "10px 24px", background: "#f57224", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Full Name *</label>
                  <input type="text" required placeholder="John Doe" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Phone</label>
                  <input type="tel" placeholder="+1 (000) 000-0000" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Email Address *</label>
                <input type="email" required placeholder="your@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Subject</label>
                <input type="text" placeholder="How can we help?" value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>Message *</label>
                <textarea required rows={5} placeholder="Tell us about your inquiry..." value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#f57224")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
                />
              </div>
              <button type="submit" style={{ padding: "13px 28px", background: "#f57224", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start", transition: "background 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#e06010")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f57224")}
              >
                <Send size={15} /> Send Message
              </button>
            </form>
          )}
        </div>

        {/* Map placeholder + CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ borderRadius: "8px", overflow: "hidden", height: "360px", background: "#e8e8e8", position: "relative" }}>
            <img src="https://placehold.co/600x360/e0e8f0/888?text=Map+Placeholder" alt="Store location map" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(2px)" }}>
              <MapPin size={36} color="#f57224" />
              <p style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "15px" }}>24/26 Strait Bargate</p>
              <p style={{ color: "#666", fontSize: "13px" }}>Boston, PE21, United Kingdom</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a href="tel:+0989057868978" style={{ padding: "14px 20px", background: "#1a1a1a", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#333")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")}
            >
              <Phone size={15} /> Get Support on Call
            </a>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ padding: "14px 20px", border: "2px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a"; }}
            >
              <MapPin size={15} /> Get Direction
            </a>
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
