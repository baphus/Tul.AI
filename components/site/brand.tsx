import Link from "next/link";
import Image from "next/image";

import { ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

/**
 * The supplied Tul.AI logo, kept in the shared brand primitive so it appears
 * consistently anywhere the product identifies itself.
 */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <Image
      src="/tulai-logo.png"
      alt=""
      width={48}
      height={48}
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    />
  );
}

export function BrandMark({
  className,
  tone = "ink",
  strong = false,
  asLink = true,
}: {
  className?: string;
  tone?: "ink" | "on-dark";
  strong?: boolean;
  asLink?: boolean;
}) {
  const content = (
    <>
      <BrandGlyph />
      <span
        className={cn(
          "t-display-md font-display",
          strong && "t-wordmark-strong",
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
