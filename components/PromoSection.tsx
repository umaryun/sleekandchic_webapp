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
        className="rounded overflow-hidden bg-[#B88D7A] flex flex-col md:flex-row md:items-center justify-between min-h-[220px]"
        style={{
          position: "relative",
          padding: "40px 56px",
          width: "100%",
          gap: "32px",
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
            pointerEvents: "none",
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
            pointerEvents: "none",
          }}
        />

        {/* Left content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "560px" }}>
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
          className="flex gap-2.5 sm:gap-4 justify-center md:justify-start"
          style={{ position: "relative", zIndex: 1 }}
        >
          {[
            { value: "02", label: "Days" },
            { value: "14", label: "Hours" },
            { value: "38", label: "Mins" },
            { value: "55", label: "Secs" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded p-2.5 sm:p-5 min-w-[60px] sm:min-w-[72px]"
            >
              <span
                className="text-2xl sm:text-4xl font-extrabold text-white leading-none tabular-nums"
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
