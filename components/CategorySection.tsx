import Link from "next/link";

const featuredCategories = [
  { id: 1, name: "Abayas", slug: "abayas", count: 12, icon: "/abayas.png" },
  { id: 2, name: "Bubu", slug: "bubu", count: 8, icon: "/bubu.png" },
  { id: 3, name: "Kaftan", slug: "kaftan", count: 15, icon: "/kaftans.png" },
  { id: 4, name: "Dresses", slug: "dresses", count: 20, icon: "/dresses.png" },
  { id: 5, name: "Gowns", slug: "gowns", count: 6, icon: "/gowns.png" },
  { id: 6, name: "Two-Piece", slug: "two-piece", count: 9, icon: "/two-piece.png" },
];

export default function CategorySection() {
  return (
    <section
    className="hidden sm:block"
      style={{
        maxWidth: "1280px",
        margin: "50px auto",
        padding: "0 16px",
      }}
    >
      {/* Section Header */}
      <div
      className=""
        style={{
          marginBottom: "10px",
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
        {featuredCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              textDecoration: "none",
              padding: "20px 10px 16px",
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
            <div style={{ position: "relative" }}>
              <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.icon}
                  alt={cat.name}
                  className="w-10 h-10 sm:w-[55px] sm:h-[55px] object-contain"
                />
              </div>

              {/* Count Badge */}
              <span
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#b88d7a",
                  color: "#fff",
                  fontSize: "10px",
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
