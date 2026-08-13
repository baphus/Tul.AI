import Link from "next/link";

import { ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

/**
 * The wordmark. Tul.AI is a bridge (PRD §44), so the mark is two piers and a
 * span — drawn, not photographed, and legible at 20px.
 */
export function BrandGlyph({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "on-dark";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6", className)}
      fill="none"
    >
      <path
        d="M2 15c4.8 0 7.2-8 10-8s5.2 8 10 8"
        stroke={tone === "ink" ? "var(--ink)" : "var(--brand)"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 15v5M19 15v5"
        stroke={tone === "ink" ? "var(--ink)" : "var(--brand)"}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* The span's keystone carries the brand accent on both polarities —
          decorative, and never the only way a state is communicated. */}
      <circle cx="12" cy="7" r="2.4" fill="var(--brand)" />
    </svg>
  );
}

export function BrandMark({
  className,
  tone = "ink",
  asLink = true,
}: {
  className?: string;
  tone?: "ink" | "on-dark";
  asLink?: boolean;
}) {
  const content = (
    <>
      <BrandGlyph tone={tone} className="size-6 shrink-0" />
      <span
        className={cn(
          "t-display-md font-display",
          tone === "ink" ? "text-ink" : "text-white"
        )}
      >
        Tul
        <span className={tone === "ink" ? "text-ink-deep" : "text-brand"}>.AI</span>
      </span>
    </>
  );

  if (!asLink) {
    return <span className={cn("inline-flex items-center gap-2", className)}>{content}</span>;
  }

  return (
    <Link
      href={ROUTES.home}
      className={cn("ring-brand inline-flex items-center gap-2 rounded-xs", className)}
      aria-label="Tul.AI — home"
    >
      {content}
    </Link>
  );
}
