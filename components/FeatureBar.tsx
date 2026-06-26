import { Truck, RotateCcw, ShieldCheck, HeadphonesIcon } from "lucide-react";

const features = [
  {
    Icon: Truck,
    title: "Free Delivery",
    desc: "For all orders over $99",
  },
  {
    Icon: RotateCcw,
    title: "Free Returns",
    desc: "Within 30 days of purchase",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Payment",
    desc: "100% secure transactions",
  },
  {
    Icon: HeadphonesIcon,
    title: "24/7 Support",
    desc: "Dedicated support team",
  },
];

export default function FeatureBar() {
  return (
    <section
      style={{
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        padding: "32px 16px",
        marginBottom: "48px",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
        }}
      >
        {features.map(({ Icon, title, desc }) => (
          <div
            key={title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#fff3ec",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} color="#b88d7a" />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "2px",
                }}
              >
                {title}
              </h4>
              <p style={{ fontSize: "12px", color: "#888" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
