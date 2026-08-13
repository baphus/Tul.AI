import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import "./globals.css";

/**
 * Inter Variable is DESIGN.md's sanctioned substitute for Super Sans VF — the
 * variable weight axis is what lets the brand sit at 460/540/600 instead of the
 * default 400/500/700. Weights are applied through the .t-* classes.
 */
const inter = Inter({
  variable: "--font-sans",
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
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="t-body min-h-full">{children}</body>
    </html>
  );
}
