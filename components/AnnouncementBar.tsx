"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { announcements } from "@/data";

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % announcements.length);
  }, []);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  if (!visible) return null;

  const ann = announcements[current];

  return (
    <div
      style={{
        backgroundColor: "#b88d7a",
        color: "#ffffff",
        fontSize: "13px",
        padding: "9px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          position: "relative",
        }}
      >
        <button
          onClick={prev}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "0 4px",
            display: "flex",
            alignItems: "center",
            opacity: 0.7,
          }}
          aria-label="Previous announcement"
        >
          <ChevronLeft size={14} />
        </button>

        <div style={{ textAlign: "center", flex: 1 }}>
          <strong>{ann.bold}</strong>
          {ann.text}{" "}
          <Link
            href={ann.href}
            style={{
              color: "#fff",
              fontWeight: 600,
              textDecoration: "underline",
              marginLeft: "4px",
            }}
          >
            {ann.linkText}
          </Link>
        </div>

        <button
          onClick={next}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "0 4px",
            display: "flex",
            alignItems: "center",
            opacity: 0.7,
          }}
          aria-label="Next announcement"
        >
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => setVisible(false)}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "0",
            display: "flex",
            alignItems: "center",
            position: "absolute",
            right: 0,
            opacity: 0.7,
          }}
          aria-label="Close announcement"
        >
          <X size={14} />
        </button>
      </div>

      {/* Slide indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          marginTop: "5px",
        }}
      >
        {announcements.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? "16px" : "6px",
              height: "4px",
              borderRadius: "2px",
              background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
            aria-label={`Go to announcement ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
