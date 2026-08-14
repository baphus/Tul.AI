import type { Metadata, Viewport } from "next";
import { Anton, Inter, Manrope, Geist_Mono } from "next/font/google";

import { SITE_URL } from "@/lib/site";

import "./globals.css";

/**
 * Two faces, per DESIGN.md §Typography — and DESIGN.md §Note on Font
 * Substitutes names both of these as the open-source stand-ins:
 *
 *   Manrope 800 — the display voice, in place of the proprietary Wise Sans.
 *                 Every hero and section headline, never body.
 *   Inter       — sub-displays at 600, all body, labels and buttons.
 *
 * Both are loaded variable so the .t-* classes can drive weight through
 * font-variation-settings rather than swapping static files.
 *
 * A third face, `--font-hero`, is used by exactly one element: the landing
 * page's `<h1>` (see `.t-hero` in globals.css). It exists as its own variable
 * so the compressed display face is swappable without touching the type scale.
 *
 * To swap in a licensed Futura PT Condensed, replace the Anton import with:
 *
 *   import localFont from "next/font/local";
 *   const hero = localFont({
 *     src: "./fonts/futura-condensed-pt-medium.woff2",
 *     variable: "--font-hero",
 *     display: "swap",
 *   });
 *
 * ...and nothing else changes. Note that the only condensed cut Paratype ships
 * in the bundle we looked at is Medium, so `.t-hero` would want a heavier
 * optical treatment — or a genuinely bold condensed face — to carry the weight
 * DESIGN.md asks of a display.
 */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/* Anton ships a single weight and is already black, so there is no variable
   axis to drive — `.t-hero` sets font-weight explicitly rather than reaching
   for font-variation-settings the way the Manrope displays do. */
const hero = Anton({
  variable: "--font-hero",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "Tul.AI — Bridge to your next opportunity",
    template: "%s · Tul.AI",
  },
  description:
    "Tul.AI bridges Filipino students to scholarships and financial aid. Tell us who you are, and see verified opportunities that fit — with the published requirements behind every match.",
  applicationName: "Tul.AI",
  authors: [{ name: "Tul.AI", url: SITE_URL.toString() }],
  creator: "Tul.AI",
  publisher: "Tul.AI",
  category: "Education",
  classification: "Education",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/tul-ai-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  keywords: [
    "scholarships Philippines",
    "CHED scholarship",
    "DOST-SEI scholarship",
    "OWWA education benefit",
    "Cebu scholarship",
    "financial aid",
  ],
  openGraph: {
    title: "Tul.AI — Bridge to your next opportunity",
    description:
      "From scholarships to what's next, Tul.AI helps students discover opportunities matched to who they are.",
    siteName: "Tul.AI",
    type: "website",
    locale: "en_PH",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Tul.AI — Bridge to your next opportunity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tul.AI — Bridge to your next opportunity",
    description: "Discover verified scholarships and financial aid for Filipino students.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#9fe870",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${hero.variable} ${mono.variable} h-full`}
    >
      <body className="t-body min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
