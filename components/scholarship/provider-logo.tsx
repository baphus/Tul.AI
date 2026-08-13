import Image from "next/image";
import type { CSSProperties } from "react";

import { providerHue, scholarshipLogo } from "@/lib/scholarships";
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

/** The provider logo as a crest: white chip, tinted hairline. */
export function ProviderCrest({
  index,
  provider,
  className,
}: {
  index: number;
  provider: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tinted relative size-10 flex-none overflow-hidden rounded-md border border-[color:var(--tint-border)] bg-canvas",
        className
      )}
      style={providerTint(index)}
    >
      <Image
        src={scholarshipLogo(index)}
        alt={`${provider} logo`}
        fill
        sizes="56px"
        className="object-contain p-1"
      />
    </span>
  );
}

/** The same logo blown up as a faint watermark behind card content. */
export function ProviderWatermark({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute opacity-[0.07]", className)}
    >
      <Image
        src={scholarshipLogo(index)}
        alt=""
        fill
        sizes="240px"
        className="object-contain"
      />
    </span>
  );
}
