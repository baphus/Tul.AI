import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tul.AI — Bridge to your next opportunity",
    short_name: "Tul.AI",
    description: "Discover verified scholarships and financial aid for Filipino students.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8ebe6",
    theme_color: "#9fe870",
    lang: "en-PH",
    categories: ["education", "scholarships"],
    icons: [
      {
        src: "/tul-ai-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/tul-ai-icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
