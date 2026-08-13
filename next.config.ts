import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     * Provider crests. 26 of the 32 records in data/scholarships.json carry a
     * `logo_url` on this host; without it declared here, next/image refuses the
     * URL and the crest renders empty. Narrowed to the exact host and path
     * prefix rather than a wildcard: an open image host is an open proxy, and
     * these URLs are the only remote images the app renders.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
