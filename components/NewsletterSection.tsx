"use client";

import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section
      style={{
        background: "#b88d7a",
        padding: "56px 16px",
        marginBottom: 0,
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <Mail size={24} color="#fff" />
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Newsletter
          </p>
        </div>
        <h2
          style={{
            fontSize: "30px",
            fontWeight: 800,
            color: "#fff",
            marginBottom: "8px",
            lineHeight: 1.2,
          }}
        >
          Subscribe To Our Newsletter
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.75)",
            marginBottom: "28px",
          }}
        >
          Get the latest updates on new products and upcoming sales
        </p>

        {submitted ? (
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "16px 24px",
              borderRadius: "4px",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            🎉 Thank you for subscribing!
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "0",
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: "14px 18px",
                border: "none",
                borderRadius: "2px 0 0 2px",
                outline: "none",
                fontSize: "14px",
                color: "#1a1a1a",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 24px",
                background: "#1a1a1a",
                color: "#fff",
                border: "none",
                borderRadius: "0 2px 2px 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                fontSize: "14px",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#333")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a")
              }
            >
              Subscribe
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
