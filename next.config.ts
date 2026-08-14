import type { NextConfig } from "next";

/*
 * No `images.remotePatterns` on purpose. Provider crests were briefly loaded
 * from the Cloudinary URLs in data/scholarships.json; those 26 files now live in
 * public/logos/providers/ and are resolved by `providerLogo()` in
 * lib/scholarships.ts, so the app renders no remote images at all. Keep it that
 * way unless something genuinely needs a third-party host — an allowed image
 * host is an image proxy, and this app has no reason to be one.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
