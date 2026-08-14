import Image from "next/image";
import type { CSSProperties } from "react";

import { providerHue } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * Inline hue/saturation for a provider, consumed by the `.tinted` rules in
 * globals.css. Two numbers in custom properties keep one rule set serving every
 * provider without a colour map per logo.
 */
export function providerTint(index: number): CSSProperties {
  const { h, s } = providerHue(index);
  return { "--th": String(h), "--ts": String(s) } as CSSProperties;
}

/**
 * Initials for a provider with no published crest. Prefers the acronym the
 * provider itself puts in parentheses — "…Aquatic Resources (BFAR) – Department
 * of Agriculture (DA)" reads as BFAR, not BOFAAR — and otherwise takes the
 * initials of the first words.
 */
export function providerMonogram(provider: string): string {
  const acronym = provider.match(/\(([A-Z][A-Za-z0-9&-]{1,7})\)/)?.[1];
  if (acronym) return acronym.toUpperCase().slice(0, 5);

  return (
    provider
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 3)
      .map((word) => word[0]!.toUpperCase())
      .join("") || provider.slice(0, 2).toUpperCase()
  );
}

/**
 * The provider logo as a crest: white chip, tinted hairline.
 *
 * `logo` resolution, in order:
 *   a URL      → render it, the provider's own published crest;
 *   `null`     → render a monogram. The caller has the record and it carries no
 *                crest, so there is nothing truthful to draw;
 *   omitted    → the legacy index-keyed local file, for callers that have only
 *                an index. Prefer passing `logo={card.logo}` — the index-keyed
 *                map only covers the six original demo providers and will
 *                mislabel anything else.
 */
export function ProviderCrest({
  index,
  provider,
  logo,
  className,
}: {
  index: number;
  provider: string;
  logo: string | null;
  className?: string;
}) {
  if (!logo) return null;
  const src = logo;

  return (
    <span
      className={cn(
        "tinted relative size-10 flex-none overflow-hidden rounded-md border border-[color:var(--tint-border)] bg-canvas",
        className
      )}
      style={providerTint(index)}
    >
      {src ? (
        <Image
          src={src}
          alt={`${provider} logo`}
          fill
          sizes="72px"
          className="object-contain p-1"
        />
      ) : (
        <span
          aria-label={`${provider} — no logo published`}
          role="img"
          className="grid size-full place-items-center px-0.5 text-center text-[0.625rem] leading-none font-semibold tracking-tight text-[color:var(--tint-ink)] tabular-nums"
        >
          {providerMonogram(provider)}
        </span>
      )}
    </span>
  );
}

/** The same logo blown up as a faint watermark behind card content. */
export function ProviderWatermark({
  logo,
  className,
}: {
  logo: string | null;
  className?: string;
}) {
  if (!logo) return null;

  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute opacity-[0.07]", className)}
    >
      <Image
        src={logo}
        alt=""
        fill
        sizes="240px"
        className="object-contain"
      />
    </span>
  );
}
