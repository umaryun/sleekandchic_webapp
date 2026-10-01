import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal and transactional pages have nothing for search engines.
      disallow: ["/api/", "/cart", "/checkout", "/profile", "/login", "/register", "/password/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
