import type { MetadataRoute } from "next";

import { ROUTES } from "@/lib/logic/routes";
import { DATA } from "@/lib/scholarships";
import { siteUrl } from "@/lib/site";

const MARKETING_ROUTES = [
  { path: ROUTES.home, changeFrequency: "weekly", priority: 1 },
  { path: ROUTES.scholarships, changeFrequency: "daily", priority: 0.9 },
  { path: ROUTES.howItWorks, changeFrequency: "monthly", priority: 0.7 },
  { path: ROUTES.roadmap, changeFrequency: "monthly", priority: 0.6 },
  { path: ROUTES.privacy, changeFrequency: "yearly", priority: 0.4 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...MARKETING_ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: siteUrl(path),
      changeFrequency,
      priority,
    })),
    ...DATA.map((scholarship) => ({
      url: siteUrl(ROUTES.scholarship(scholarship.id)),
      lastModified: scholarship.lastVerified === "Unknown" ? undefined : scholarship.lastVerified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
