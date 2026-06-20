"use client";

import Link from "next/link";
import { Calendar, User, Eye, Tag, Facebook, Twitter, Linkedin, ArrowLeft, ArrowRight } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const POST = {
  title: "4 Expert Tips On How To Choose The Right Men's Wallet",
  excerpt: "Finding the perfect wallet is an art. Here are four expert tips to help you make the right choice every time.",
  author: "Cullen Kling", date: "Jun 12, 2025", views: "2,063", category: "Fashion", readTime: "5 min read",
  image: "https://placehold.co/1200x600/e8e4de/999?text=Blog+Feature+Image",
  content: [
    { type: "p", text: "Choosing the right men's wallet is about more than just finding a place to store your cash and cards. It's a style statement, a practical decision, and for many men, an accessory they'll carry every single day for years." },
    { type: "h2", text: "1. Consider Your Lifestyle Needs" },
    { type: "p", text: "Before you even start looking at styles, think about how you actually use your wallet. Do you carry a lot of cards? Do you prefer cash or are you mostly digital? How about receipts — do they tend to pile up? Understanding your daily habits will help you narrow down the type of wallet that will work best for you." },
    { type: "p", text: "If you're a minimalist who mostly uses cards and your phone for payments, a slim card holder or money clip might be perfect. If you still carry cash regularly, a bifold or trifold with bill compartments is more practical." },
    { type: "h2", text: "2. Choose the Right Material" },
    { type: "p", text: "The material of your wallet directly impacts its durability, look, and feel. Full-grain leather is the highest quality and most durable option — it develops a beautiful patina over time. Top-grain leather is slightly more processed but still excellent quality." },
    { type: "p", text: "For those on a budget or looking for a vegan option, there are excellent synthetic materials and canvas wallets available. Just make sure to check the stitching quality, as this is often where cheaper options fall apart." },
    { type: "h2", text: "3. Match It to Your Style" },
    { type: "p", text: "Your wallet should complement your overall aesthetic. If you wear a lot of formal attire, a slim leather bifold in black or dark brown is a classic choice. If your style is more casual, you have more freedom to experiment with colors, textures, and materials." },
    { type: "p", text: "Consider the hardware too — gold or silver buckles and accents should ideally match other metal accessories you wear, like your watch or belt buckle." },
    { type: "h2", text: "4. Don't Overlook Security Features" },
    { type: "p", text: "In today's world, RFID protection is worth considering. Many modern wallets include RFID-blocking technology that prevents electronic pickpocketing of your contactless cards. While the risk is relatively low, it's a nice feature for added peace of mind." },
    { type: "p", text: "Also think about how secure the wallet keeps your cards and cash. Some bifolds have magnetic closures, while trifolds rely on their structure to keep everything in place." },
  ],
  tags: ["Wallet", "Fashion", "Men's Style", "Accessories"],
};

const RELATED = [
  { id: 2, slug: "sexy-clutches-how-to-choose-the-right-one", title: "Sexy Clutches: How to Choose the Right One", date: "May 28, 2025", image: "https://placehold.co/300x200/dce4e8/999?text=Related+1" },
  { id: 3, slug: "the-complete-guide-to-handcrafted-home-decor", title: "The Complete Guide to Handcrafted Home Décor", date: "May 15, 2025", image: "https://placehold.co/300x200/e8dce4/999?text=Related+2" },
  { id: 4, slug: "sustainable-fashion-tips-for-2025", title: "Sustainable Fashion: 8 Tips for a More Eco-Friendly Wardrobe", date: "Apr 22, 2025", image: "https://placehold.co/300x200/dce8dc/999?text=Related+3" },
];

export default function BlogDetailPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title={POST.title} crumbs={[{ label: "Blog", href: "/blog" }]} />
      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 300px", gap: "36px", alignItems: "flex-start" }}>
        {/* Article */}
        <article>
          {/* Feature image */}
          <div style={{ borderRadius: "8px", overflow: "hidden", marginBottom: "28px", aspectRatio: "2/1" }}>
            <img src={POST.image} alt={POST.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* Meta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            {[
              { Icon: User, text: POST.author },
              { Icon: Calendar, text: POST.date },
              { Icon: Eye, text: `${POST.views} views` },
              { Icon: Tag, text: POST.category },
            ].map(({ Icon, text }) => (
              <span key={text} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#888" }}>
                <Icon size={13} color="#f57224" /> {text}
              </span>
            ))}
            <span style={{ fontSize: "12px", color: "#888" }}>⏱ {POST.readTime}</span>
          </div>

          <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.25, marginBottom: "16px" }}>{POST.title}</h1>
          <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.8, marginBottom: "28px", fontStyle: "italic", borderLeft: "3px solid #f57224", paddingLeft: "16px" }}>{POST.excerpt}</p>

          {/* Content */}
          <div>
            {POST.content.map((block, i) => (
              block.type === "h2" ? (
                <h2 key={i} style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginTop: "36px", marginBottom: "14px" }}>{block.text}</h2>
              ) : (
                <p key={i} style={{ fontSize: "15px", color: "#555", lineHeight: 1.9, marginBottom: "16px" }}>{block.text}</p>
              )
            ))}
          </div>

          {/* Tags + Share */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #f0f0f0", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Tags:</span>
              {POST.tags.map(tag => (
                <Link key={tag} href={`/blog?tag=${tag.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: "12px", padding: "4px 12px", border: "1px solid #e5e5e5", borderRadius: "20px", color: "#666", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f57224"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#f57224"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#666"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e5e5e5"; }}
                >{tag}</Link>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Share:</span>
              {[{ Icon: Facebook, color: "#1877F2" }, { Icon: Twitter, color: "#1da1f2" }, { Icon: Linkedin, color: "#0077b5" }].map(({ Icon, color }, i) => (
                <button key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Prev/Next */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "32px" }}>
            <Link href="/blog" style={{ padding: "16px", border: "1px solid #f0f0f0", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f57224")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f0f0f0")}
            >
              <ArrowLeft size={18} color="#f57224" />
              <div>
                <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "3px" }}>Previous Post</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>Back to Blog</p>
              </div>
            </Link>
            <Link href="/blog/sexy-clutches-how-to-choose-the-right-one" style={{ padding: "16px", border: "1px solid #f0f0f0", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", textAlign: "right", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f57224")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f0f0f0")}
            >
              <div>
                <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "3px" }}>Next Post</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>Sexy Clutches Guide</p>
              </div>
              <ArrowRight size={18} color="#f57224" />
            </Link>
          </div>

          {/* Related Posts */}
          <div style={{ marginTop: "48px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", marginBottom: "24px" }}>Related Posts</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {RELATED.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid #f0f0f0", transition: "box-shadow 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
                  >
                    <div style={{ height: "140px", overflow: "hidden" }}>
                      <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
                      />
                    </div>
                    <div style={{ padding: "14px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.4, marginBottom: "6px" }}>{post.title}</p>
                      <p style={{ fontSize: "11px", color: "#aaa" }}>{post.date}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "24px", position: "sticky", top: "90px" }}>
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "6px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "14px" }}>About the Author</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <img src="https://placehold.co/56x56/e8e4de/888?text=CK" alt={POST.author} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{POST.author}</p>
                <p style={{ fontSize: "12px", color: "#f57224" }}>Fashion Editor</p>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>Fashion enthusiast and style expert with over 10 years of experience in the industry.</p>
          </div>

          <div style={{ background: "#f57224", padding: "24px", borderRadius: "6px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: "10px" }}>Subscribe to our newsletter</p>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Get the latest posts</h4>
            <input type="email" placeholder="Your email address" style={{ width: "100%", padding: "10px 12px", border: "none", borderRadius: "3px", fontSize: "13px", marginBottom: "10px", outline: "none" }} />
            <button style={{ width: "100%", padding: "10px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Subscribe</button>
          </div>
        </aside>
      </div>
    </ShopLayout>
  );
}
