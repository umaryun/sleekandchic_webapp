import Link from "next/link";

const featuredCategories = [
  {
    id: 1,
    name: "Gift Sets",
    slug: "gift-sets",
    count: 4,
    image: "/cat-gift-sets.png",
  },
  {
    id: 2,
    name: "Plastic Gifts",
    slug: "plastic-gifts",
    count: 3,
    image: "/cat-plastic-gifts.png",
  },
  {
    id: 3,
    name: "Handy Cream",
    slug: "handy-cream",
    count: 8,
    image: "/cat-handy-cream.png",
  },
  {
    id: 4,
    name: "Cosmetics",
    slug: "cosmetics",
    count: 7,
    image: "/cat-cosmetics.png",
  },
  {
    id: 5,
    name: "Silk Accessories",
    slug: "silk-accessories",
    count: 2,
    image: "/cat-silk-accessories.png",
  },
  {
    id: 6,
    name: "Finest Skincare Lotions",
    slug: "finest-skincare-lotions",
    count: 0,
    image: "/cat-skincare.png",
  },
];

export default function CategorySection() {
  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "80px auto",
        padding: "0 16px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.2,
          }}
        >
          Top{" "}
          <span style={{ color: "#b88d7a", fontStyle: "italic" }}>
            Categories
          </span>
        </h2>
      </div>

      {/* Category Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "20px",
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
              gap: "14px",
              textDecoration: "none",
              padding: "28px 12px 20px",
              background: "#fff",
              borderRadius: "4px",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#b88d7a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#f0f0f0";
            }}
          >
            {/* Icon circle with badge */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  background: "#f8f8f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Count Badge */}
              <span
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#b88d7a",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {cat.count}
              </span>
            </div>

            {/* Name */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#1a1a1a",
                textAlign: "center",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
