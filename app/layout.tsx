import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";

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

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tul.AI — Bridge to your next opportunity",
    template: "%s · Tul.AI",
  },
  description:
    "Tul.AI bridges Filipino students to scholarships and financial aid. Tell us who you are, and see verified opportunities that fit — with the published requirements behind every match.",
  applicationName: "Tul.AI",
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
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${mono.variable} h-full`}
    >
      <body className="t-body min-h-full">{children}</body>
    </html>
  );
}
