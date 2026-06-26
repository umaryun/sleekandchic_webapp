import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PromoSection() {
  return (
    <section
      style={{
        maxWidth: "1280px",
        margin: "0 auto 48px",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "4px",
          overflow: "hidden",
          background: "#B88D7A",
          padding: "60px 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "220px",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            border: "60px solid rgba(255,255,255,0.08)",
            right: "-60px",
            top: "-80px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            border: "40px solid rgba(255,255,255,0.06)",
            right: "80px",
            bottom: "-60px",
          }}
        />

        {/* Left content */}
        <div style={{ position: "relative", maxWidth: "560px" }}>
          <p
            style={{
              fontSize: "12px",
              color: "#fff",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Limited Time Offer
          </p>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Summer Sale — Get{" "}
            <span style={{ color: "#fff" }}>30% Off</span>
          </h2>
          <p
            style={{
              color: "#fff",
              fontSize: "15px",
              marginBottom: "28px",
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            Discover our exclusive summer collection and enjoy massive discounts
            on selected items.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 32px",
              background: "#1a1a1a",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
              borderRadius: "2px",
              letterSpacing: "0.5px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#333")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")
            }
          >
            Shop The Sale
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Right: Countdown */}
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: "16px",
          }}
        >
          {[
            { value: "02", label: "Days" },
            { value: "14", label: "Hours" },
            { value: "38", label: "Mins" },
            { value: "55", label: "Secs" },
          ].map(({ value, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                padding: "16px 20px",
                minWidth: "72px",
              }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {value}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                  marginTop: "4px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
