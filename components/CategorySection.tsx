import Link from "next/link";

const featuredCategories = [
  {
    id: 1,
    name: "Pro Glasses",
    slug: "pro-glasses",
    count: 42,
    image: "https://placehold.co/160x160/e4ecf5/888?text=Glasses",
    bg: "#e4ecf5",
  },
  {
    id: 2,
    name: "Casual Shoes",
    slug: "casual-shoes",
    count: 78,
    image: "https://placehold.co/160x160/f5e4ec/888?text=Shoes",
    bg: "#f5e4ec",
  },
  {
    id: 3,
    name: "Gift Sets",
    slug: "gift-sets",
    count: 33,
    image: "https://placehold.co/160x160/ecf5e4/888?text=Gifts",
    bg: "#ecf5e4",
  },
  {
    id: 4,
    name: "Cosmetics",
    slug: "cosmetics",
    count: 91,
    image: "https://placehold.co/160x160/f5f0e4/888?text=Cosmetics",
    bg: "#f5f0e4",
  },
  {
    id: 5,
    name: "Bags & Purses",
    slug: "bags-purses",
    count: 57,
    image: "https://placehold.co/160x160/e4f5f0/888?text=Bags",
    bg: "#e4f5f0",
  },
  {
    id: 6,
    name: "Furniture",
    slug: "furniture",
    count: 24,
    image: "https://placehold.co/160x160/f0e4f5/888?text=Furniture",
    bg: "#f0e4f5",
  },
  {
    id: 7,
    name: "Sunglasses",
    slug: "sunglasses",
    count: 38,
    image: "https://placehold.co/160x160/fef0e4/888?text=Sunglasses",
    bg: "#fef0e4",
  },
  {
    id: 8,
    name: "Crafts",
    slug: "crafts",
    count: 64,
    image: "https://placehold.co/160x160/e4fef0/888?text=Crafts",
    bg: "#e4fef0",
  },
];

export default function CategorySection() {
  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "0 auto 40px",
        padding: "0 16px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "#f57224",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Featured
          </p>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            Browse By Category
          </h2>
        </div>
        <Link
          href="/products"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1a1a1a",
            textDecoration: "none",
            borderBottom: "1px solid #1a1a1a",
            paddingBottom: "2px",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f57224";
            e.currentTarget.style.borderColor = "#f57224";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#1a1a1a";
            e.currentTarget.style.borderColor = "#1a1a1a";
          }}
        >
          View All →
        </Link>
      </div>

      {/* Category Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "16px",
        }}
      >
        {featuredCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              padding: "20px 8px",
              borderRadius: "8px",
              background: cat.bg,
              border: "1px solid transparent",
              transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(-4px)";
              el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
              el.style.borderColor = "#f57224";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
              el.style.borderColor = "transparent";
            }}
          >
            {/* Category image */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Name */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  lineHeight: 1.3,
                  marginBottom: "2px",
                }}
              >
                {cat.name}
              </p>
              <p style={{ fontSize: "11px", color: "#888" }}>({cat.count})</p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
