import Link from "next/link";
import { ArrowRight } from "lucide-react";

const banners = [
  {
    id: 1,
    eyebrow: "New Arrivals",
    title: "New Modern &\nStylet Crafts",
    cta: "Shop Now",
    href: "/products",
    bg: "#f0ece4",
    image: "https://placehold.co/520x280/e8e0d4/aaa?text=Craft+Collection",
    textColor: "#1a1a1a",
  },
  {
    id: 2,
    eyebrow: "Best Seller",
    title: "Popular Energy with\nour newest collection",
    cta: "Shop Now",
    href: "/products",
    bg: "#1a1a1a",
    image: "https://placehold.co/520x280/2a2a2a/555?text=New+Collection",
    textColor: "#ffffff",
  },
];

export default function FeaturedBanners() {
  return (
    <section className="border w-full mx-auto my-8 px-auto justify-center">
      <div className="border max-w-[1280px] px-4 grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((banner) => (
          <div
            key={banner.id}
            style={{
              position: "relative",
              borderRadius: "4px",
              overflow: "hidden",
              background: banner.bg,
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Background image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${banner.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center right",
                opacity: 0.3,
              }}
            />

            {/* Text content */}
            <div
              style={{
                position: "relative",
                padding: "36px 40px",
                flex: 1,
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#b88d7a",
                  marginBottom: "10px",
                }}
              >
                {banner.eyebrow}
              </p>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: banner.textColor,
                  lineHeight: 1.35,
                  marginBottom: "20px",
                  whiteSpace: "pre-line",
                }}
              >
                {banner.title}
              </h2>
              <Link
                href={banner.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: banner.textColor,
                  textDecoration: "none",
                  borderBottom: `1px solid ${banner.textColor === "#ffffff" ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.4)"}`,
                  paddingBottom: "2px",
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#b88d7a";
                  e.currentTarget.style.borderColor = "#b88d7a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = banner.textColor;
                  e.currentTarget.style.borderColor =
                    banner.textColor === "#ffffff"
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(26,26,26,0.4)";
                }}
              >
                {banner.cta}
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Decorative product image */}
            <div
              className="hidden sm:block absolute right-0 bottom-0 top-0 w-[45%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${banner.image})`,
              }}
            />
          </div>
        ))}
      </div>
      

    </section>
  );
}
