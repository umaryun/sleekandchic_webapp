import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

const footerLinks = {
  Information: [
    { label: "About Us", href: "/about" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Careers", href: "/careers" },
    { label: "Affiliate", href: "/affiliate" },
    { label: "Sitemap", href: "/sitemap" },
  ],
  "Customer Service": [
    { label: "Help Center", href: "/help" },
    { label: "Track Your Order", href: "/orders/tracking" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Store Locator", href: "/store-locator" },
  ],
  "My Account": [
    { label: "Sign In", href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Cart", href: "/cart" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Compare", href: "/compare" },
    { label: "Order History", href: "/orders" },
  ],
};

const socialLinks = [
  { href: "#", Icon: Facebook, label: "Facebook" },
  { href: "#", Icon: Twitter, label: "Twitter" },
  { href: "#", Icon: Instagram, label: "Instagram" },
  { href: "#", Icon: Youtube, label: "YouTube" },
  { href: "#", Icon: Linkedin, label: "LinkedIn" },
];

const paymentIcons = ["Visa", "Mastercard", "PayPal", "Stripe", "Apple Pay"];

export default function Footer() {
  return (
    <footer style={{ background: "#1a1a1a", color: "#ccc" }}>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "56px 16px 40px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: "40px",
        }}
      >
        {/* Brand Column */}
        <div>
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontSize: "28px",
              fontWeight: 800,
              textDecoration: "none",
              marginBottom: "16px",
            }}
          >
            <span style={{ color: "#fff" }}>Nin</span>
            <span style={{ color: "#f57224" }}>ico</span>
          </Link>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.8,
              color: "#888",
              marginBottom: "20px",
            }}
          >
            We bring you the finest handcrafted products from around the world.
            Quality, style, and comfort — delivered to your door.
          </p>

          {/* Contact Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { Icon: MapPin, text: "123 Commerce St, New York, NY 10001" },
              { Icon: Phone, text: "+1 (800) 123-4567" },
              { Icon: Mail, text: "hello@ninico.com" },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
              >
                <Icon size={14} color="#f57224" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#888" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Social Icons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "24px",
            }}
          >
            {socialLinks.map(({ href, Icon, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888",
                  transition: "background 0.2s, border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "#f57224";
                  el.style.borderColor = "#f57224";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "transparent";
                  el.style.borderColor = "#333";
                  el.style.color = "#888";
                }}
              >
                <Icon size={14} />
              </Link>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "20px",
                paddingBottom: "10px",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              {title}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map((link) => (
                <li key={link.label} style={{ marginBottom: "10px" }}>
                  <Link
                    href={link.href}
                    style={{
                      color: "#888",
                      textDecoration: "none",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "#f57224")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "#888")
                    }
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "#f57224",
                        flexShrink: 0,
                      }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* App Download */}
      <div
        style={{
          borderTop: "1px solid #2a2a2a",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "24px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Download Our App
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            {["App Store", "Google Play"].map((store) => (
              <Link
                key={store}
                href="#"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#f57224")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#333")
                }
              >
                {store === "App Store" ? "🍎" : "🤖"} {store}
              </Link>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            We Accept
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {paymentIcons.map((payment) => (
              <div
                key={payment}
                style={{
                  padding: "4px 10px",
                  background: "#2a2a2a",
                  borderRadius: "3px",
                  fontSize: "10px",
                  color: "#aaa",
                  fontWeight: 600,
                  letterSpacing: "0.3px",
                }}
              >
                {payment}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          borderTop: "1px solid #222",
          padding: "16px",
          textAlign: "center",
          fontSize: "12px",
          color: "#555",
        }}
      >
        © {new Date().getFullYear()} Ninico. All rights reserved. Powered by{" "}
        <Link
          href="https://botble.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#f57224", textDecoration: "none" }}
        >
          Botble Technologies
        </Link>
        .
      </div>
    </footer>
  );
}
