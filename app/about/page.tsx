"use client";

import Link from "next/link";
import { Award, Users, Globe, Leaf } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const stats = [{ n: "12K+", l: "Happy Customers" }, { n: "500+", l: "Products" }, { n: "50+", l: "Countries" }, { n: "8", l: "Years Experience" }];
const team = [
  { name: "Sarah Johnson", role: "Founder & CEO", img: "https://placehold.co/280x320/e8e4de/888?text=Sarah" },
  { name: "Mark Williams", role: "Head of Design", img: "https://placehold.co/280x320/dce4e8/888?text=Mark" },
  { name: "Lisa Chen", role: "Lead Developer", img: "https://placehold.co/280x320/e8dce4/888?text=Lisa" },
  { name: "James Park", role: "Operations Manager", img: "https://placehold.co/280x320/dce8dc/888?text=James" },
];
const values = [
  { Icon: Award, title: "Premium Quality", desc: "Every product we carry meets our strict quality standards, ensuring you receive only the best." },
  { Icon: Users, title: "Customer First", desc: "Our customers are at the heart of everything we do. Your satisfaction is our top priority." },
  { Icon: Globe, title: "Global Reach", desc: "We ship to over 50 countries, bringing unique handcrafted goods to customers worldwide." },
  { Icon: Leaf, title: "Sustainability", desc: "We partner with eco-friendly artisans and use sustainable packaging in all our shipments." },
];

export default function AboutPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="About Us" crumbs={[]} />

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)", padding: "80px 16px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", border: "80px solid rgba(245,114,36,0.05)", right: "-80px", top: "-80px" }} />
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", border: "60px solid rgba(245,114,36,0.04)", left: "-50px", bottom: "-50px" }} />
        <div style={{ position: "relative", maxWidth: "700px", margin: "0 auto" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "3px", color: "#f57224", textTransform: "uppercase", marginBottom: "16px" }}>Our Story</p>
          <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "20px" }}>
            Crafted with Passion,<br />Delivered with Care
          </h1>
          <p style={{ fontSize: "16px", color: "#888", lineHeight: 1.8 }}>
            Founded in 2016, Sleekandchic connects discerning shoppers with the world&apos;s finest handcrafted goods. We believe that every object in your home should tell a story.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#f57224", padding: "48px 16px" }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ n, l }) => (
            <div key={l}>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>{n}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-[1280px] mx-auto my-18 px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", color: "#f57224", textTransform: "uppercase", marginBottom: "12px" }}>Our Mission</p>
          <h2 style={{ fontSize: "34px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.25, marginBottom: "20px" }}>
            Bringing Artisan Crafts to the Modern World
          </h2>
          <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.9, marginBottom: "16px" }}>
            We work directly with artisans and small businesses from over 30 countries, ensuring fair wages and sustainable practices while bringing unique, handcrafted goods to customers worldwide.
          </p>
          <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.9, marginBottom: "28px" }}>
            Each product in our collection is carefully curated by our team of experts who travel the globe to discover hidden gems and emerging craftspeople.
          </p>
          <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 28px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "3px", fontWeight: 700, fontSize: "14px", transition: "background 0.2s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#e06010")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f57224")}
          >
            Shop Our Collection →
          </Link>
        </div>
        <div style={{ borderRadius: "8px", overflow: "hidden" }}>
          <img src="https://placehold.co/600x480/f0ece4/999?text=Our+Workshop" alt="Our workshop" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "#f8f8f8", padding: "72px 16px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", color: "#f57224", textTransform: "uppercase", marginBottom: "10px" }}>Why Choose Us</p>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1a1a" }}>Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {values.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: "#fff", padding: "32px 24px", borderRadius: "6px", textAlign: "center", border: "1px solid #f0f0f0", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
              >
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fff3ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <Icon size={24} color="#f57224" />
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "10px" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: "1280px", margin: "72px auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", color: "#f57224", textTransform: "uppercase", marginBottom: "10px" }}>The People Behind Sleekandchic</p>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1a1a" }}>Meet Our Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map(({ name, role, img }) => (
            <div key={name} style={{ textAlign: "center", borderRadius: "6px", overflow: "hidden", border: "1px solid #f0f0f0", transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
            >
              <img src={img} alt={name} style={{ width: "100%", height: "260px", objectFit: "cover" }} />
              <div style={{ padding: "18px 16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>{name}</h4>
                <p style={{ fontSize: "13px", color: "#f57224", fontWeight: 500 }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ShopLayout>
  );
}
