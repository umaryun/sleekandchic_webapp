"use client";

import Link from "next/link";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const posts = [
  { id: 1, slug: "4-expert-tips-on-how-to-choose-the-right-mens-wallet", title: "4 Expert Tips On How To Choose The Right Men's Wallet", excerpt: "Alice cautiously replied: 'but I haven't been invited yet.' 'You'll see me there,' said the Mock Turtle, and said to her...", author: "Cullen Kling", date: "Jun 12, 2025", views: "2,063", category: "Fashion", image: "https://placehold.co/800x480/e8e4de/999?text=Blog+Post+1" },
  { id: 2, slug: "sexy-clutches-how-to-choose-the-right-one", title: "Sexy Clutches: How to Choose the Right One for Every Occasion", excerpt: "The perfect clutch can elevate any outfit from simple to stunning. Here's our guide to finding the ideal clutch for every event...", author: "Maria Santos", date: "May 28, 2025", views: "1,847", category: "Style", image: "https://placehold.co/800x480/dce4e8/999?text=Blog+Post+2" },
  { id: 3, slug: "the-complete-guide-to-handcrafted-home-decor", title: "The Complete Guide to Handcrafted Home Décor", excerpt: "Transform your living space with unique handcrafted pieces. In this guide, we explore the art of mixing styles and textures...", author: "Thomas Reed", date: "May 15, 2025", views: "3,241", category: "Home", image: "https://placehold.co/800x480/e8dce4/999?text=Blog+Post+3" },
  { id: 4, slug: "sustainable-fashion-tips-for-2025", title: "Sustainable Fashion: 8 Tips for a More Eco-Friendly Wardrobe", excerpt: "Making conscious choices about what we wear is more important than ever. Here are practical tips to build a sustainable wardrobe...", author: "Emma Green", date: "Apr 22, 2025", views: "1,522", category: "Sustainability", image: "https://placehold.co/800x480/dce8dc/999?text=Blog+Post+4" },
  { id: 5, slug: "artisan-jewelry-what-makes-it-special", title: "Artisan Jewelry: What Makes Handmade Pieces So Special", excerpt: "There's something uniquely special about wearing jewelry that was crafted by hand. We explore what sets artisan pieces apart...", author: "Sophie Laurent", date: "Apr 10, 2025", views: "987", category: "Jewelry", image: "https://placehold.co/800x480/e8e8dc/999?text=Blog+Post+5" },
  { id: 6, slug: "gift-giving-guide-2025", title: "The Ultimate Gift-Giving Guide for Every Budget", excerpt: "Whether you're shopping for a best friend, family member, or colleague, our comprehensive gift guide has something for everyone...", author: "James Park", date: "Mar 30, 2025", views: "4,158", category: "Gifts", image: "https://placehold.co/800x480/dce8e8/999?text=Blog+Post+6" },
];
const categories = ["All", "Fashion", "Style", "Home", "Sustainability", "Jewelry", "Gifts"];
const recent = posts.slice(0, 4);

export default function BlogPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="Blog" crumbs={[]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 300px", gap: "36px", alignItems: "flex-start" }}>
        {/* Posts grid */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {posts.map(post => (
              <article key={post.id} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "6px", overflow: "hidden", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
              >
                <Link href={`/blog/${post.slug}`}>
                  <div style={{ overflow: "hidden", height: "200px" }}>
                    <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
                    />
                  </div>
                </Link>
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", background: "#fff3ec", color: "#f57224", borderRadius: "20px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{post.category}</span>
                  </div>
                  <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4, marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f57224")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#1a1a1a")}
                    >{post.title}</h2>
                  </Link>
                  <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#aaa" }}>
                    <span>By <strong style={{ color: "#555" }}>{post.author}</strong> · {post.date}</span>
                    <span>👁 {post.views}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Search */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "6px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "14px" }}>Search</h3>
            <div style={{ display: "flex" }}>
              <input type="text" placeholder="Search articles..." style={{ flex: 1, padding: "9px 12px", border: "1px solid #ddd", borderRight: "none", borderRadius: "3px 0 0 3px", fontSize: "13px", outline: "none" }} />
              <button style={{ padding: "9px 14px", background: "#f57224", color: "#fff", border: "none", borderRadius: "0 3px 3px 0", cursor: "pointer", fontSize: "13px" }}>🔍</button>
            </div>
          </div>

          {/* Categories */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "6px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "14px" }}>Categories</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {categories.map(cat => (
                <Link key={cat} href={cat === "All" ? "/blog" : `/blog?category=${cat.toLowerCase()}`}
                  style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "3px", color: "#555", textDecoration: "none", fontSize: "13px", transition: "background 0.2s, color 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#fff3ec"; (e.currentTarget as HTMLAnchorElement).style.color = "#f57224"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#555"; }}
                >
                  <span>{cat}</span>
                  <span style={{ color: "#aaa" }}>({cat === "All" ? posts.length : posts.filter(p => p.category === cat).length})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Posts */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "6px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "14px" }}>Recent Posts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {recent.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ display: "flex", gap: "12px", textDecoration: "none" }}>
                  <img src={post.image} alt={post.title} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.4, marginBottom: "3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f57224")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#1a1a1a")}
                    >{post.title}</p>
                    <p style={{ fontSize: "11px", color: "#aaa" }}>{post.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ShopLayout>
  );
}
