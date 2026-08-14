import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding", "/matching", "/matches", "/discover", "/review", "/profile"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
