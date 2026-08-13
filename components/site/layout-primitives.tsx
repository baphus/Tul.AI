import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md §Layout: body content centres around 1100px, prose narrower. The
 * `narrow` measure is set for reading (~70 characters), not for layout — wider
 * than that and continuous text stops being comfortable.
 */
export function Container({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        width === "narrow" && "max-w-[42rem]",
        width === "default" && "max-w-[68rem]",
        width === "wide" && "max-w-[80rem]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Section rhythm: 64px on mobile, 96px from md, per DESIGN.md §Whitespace. */
export function Section({
  children,
  className,
  id,
  tone = "canvas",
  size = "default",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "canvas" | "soft" | "indigo" | "teal";
  size?: "default" | "tight" | "loose";
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        tone === "soft" && "bg-canvas-soft",
        tone === "indigo" && "canvas-indigo",
        tone === "teal" && "canvas-teal",
        size === "tight" && "py-12 md:py-16",
        size === "default" && "py-16 md:py-24",
        size === "loose" && "py-20 md:py-28 lg:py-36",
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * A section opener. The heading carries the section on its own — there is no
 * label above it, because a kicker only ever repeats what the heading already
 * says or admits the heading is too weak.
 */
export function SectionHead({
  id,
  title,
  lead,
  tone = "ink",
  className,
}: {
  id?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "ink" | "on-dark";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <h2
        id={id}
        className={cn(
          "t-display-xl max-w-[30ch] text-balance",
          tone === "on-dark" && "text-white"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "t-body-lg max-w-[62ch] text-pretty",
            tone === "ink" ? "text-ink-mute" : "text-on-dark-mute"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

/**
 * A hairline-ruled row. The site's structural device: content sits between
 * rules the way it does in a printed table, instead of inside a card.
 */
export function RuledRow({
  children,
  className,
  last = false,
}: {
  children: ReactNode;
  className?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 py-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10",
        !last && "border-b border-hairline",
        className
      )}
    >
      {children}
    </div>
  );
}
