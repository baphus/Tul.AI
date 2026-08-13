"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/site/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

const NAV = [
  { href: ROUTES.scholarships, label: "Scholarships" },
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.institutions, label: "For institutions" },
];

/**
 * DESIGN.md `nav-bar`: a sticky bar in ink on a light surface, links set in
 * body-sm-strong, and exactly one lime pill.
 *
 * `tone="over"` sits on the sage hero band and matches it, so the bar and the
 * hero read as one surface until you scroll; `tone="light"` is the white bar on
 * body pages. Both are light — the brand has no dark navigation.
 */
export function SiteHeader({ tone = "light" }: { tone?: "over" | "light" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onSage = tone === "over";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        onSage
          ? "bg-canvas-soft/95 backdrop-blur-md"
          : "border-b border-hairline bg-canvas/95 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[75rem] items-center gap-6 px-5 sm:h-20 sm:px-8">
        <BrandMark />

        <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ring-brand t-caption-strong rounded-xs transition-colors",
                  // The active mark is ink, not lime: lime on this bar is
                  // 1.2:1 and would fail WCAG 1.4.11 as a state indicator —
                  // and DESIGN.md reserves lime for CTAs anyway.
                  active
                    ? "text-ink underline decoration-ink decoration-2 underline-offset-[6px]"
                    : "text-ink hover:underline hover:decoration-hairline hover:underline-offset-[6px]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-8">
          <Link
            href={ROUTES.scholarships}
            className="ring-brand t-caption-strong hidden rounded-xs text-ink lg:inline-flex"
          >
            Browse all
          </Link>
          <ButtonLink
            className="t-body-strong hidden h-12 px-6 text-base md:inline-flex"
            href={ROUTES.onboarding}
          >
            Find my scholarships
          </ButtonLink>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Open menu"
                  className="md:hidden"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="gap-0 bg-canvas p-6 pt-5 text-ink data-[side=right]:sm:max-w-xs"
            >
              <SheetTitle className="t-display-md">Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <nav className="mt-8 flex flex-col" aria-label="Mobile">
                {[...NAV, { href: ROUTES.privacy, label: "Privacy" }].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="ring-brand t-body-lg border-b border-hairline py-4 text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <ButtonLink
                className="t-body-strong mt-8 h-12 text-base"
                href={ROUTES.onboarding} onClick={() => setOpen(false)}
              >
                Find my scholarships
              </ButtonLink>
              <p className="t-caption mt-4 text-ink-mute">
                Free for students. No account needed to explore.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
