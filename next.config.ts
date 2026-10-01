import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // No framing (clickjacking), no plugins, no <base> hijacking. Scripts aren't
  // restricted yet; that needs per-request nonces.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Other devices allowed to open the dev server (e.g. a phone on the same
  // Wi-Fi): DEV_ORIGINS=192.168.1.20,192.168.1.21
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean),
  images: {
    formats: ["image/avif", "image/webp"],
    // Uploaded product, category and banner photos (Supabase Storage public
    // buckets). Keep in step with lib/images.ts.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**", search: "" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
