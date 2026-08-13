"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
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
 * `tone="over"` starts transparent over an indigo hero and resolves to a solid
 * bar as the hero leaves (see `.nav-resolve`); `tone="light"` is the sticky
 * white bar on body pages. Three links, one action — DESIGN.md §Navigation.
 */
export function SiteHeader({ tone = "light" }: { tone?: "over" | "light" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onDark = tone === "over";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        onDark
          ? "nav-resolve text-white"
          : "border-b border-hairline bg-canvas/90 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center gap-6 px-5 sm:h-20 sm:px-8">
        <BrandMark tone={onDark ? "on-dark" : "ink"} />

        <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ring-brand t-caption rounded-xs transition-colors",
                  onDark
                    ? active
                      ? "text-white"
                      : "text-on-dark-mute hover:text-white"
                    : active
                      ? "text-ink underline decoration-hairline-dark decoration-1 underline-offset-[6px]"
                      : "text-ink-mute hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button
            className={cn(
              "hidden h-10 px-5 md:inline-flex",
              onDark
                ? "rounded-full bg-violet-soft text-indigo hover:bg-violet-soft/85"
                : "rounded-md"
            )}
            render={<Link href={ROUTES.onboarding} />}
          >
            Find my scholarships
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Open menu"
                  className={cn(
                    "md:hidden",
                    onDark && "text-white hover:bg-white/10 hover:text-white"
                  )}
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
              <Button
                className="mt-8 h-12 rounded-md"
                render={<Link href={ROUTES.onboarding} onClick={() => setOpen(false)} />}
              >
                Find my scholarships
              </Button>
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
