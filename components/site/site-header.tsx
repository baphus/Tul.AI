"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { useState } from "react";

import { BrandMark } from "@/components/site/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/lib/logic/routes";
import { setLanguage, type Language, useLanguage } from "@/lib/logic/language";
import { cn } from "@/lib/utils";

const NAV = [
  { href: ROUTES.scholarships, label: "Scholarships" },
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.roadmap, label: "Roadmap" },
];

function CountryFlag({ language }: { language: Language }) {
  return (
    <ReactCountryFlag
      aria-hidden="true"
      svg
      countryCode={language === "ENG" ? "GB" : "PH"}
      style={{ width: "1.25rem", height: "1.25rem", borderRadius: "9999px" }}
      title={language === "ENG" ? "United Kingdom" : "Philippines"}
    />
  );
}

function LanguageSelector() {
  const language = useLanguage();

  function changeLanguage(value: string | null) {
    if (value !== "ENG" && value !== "FIL") return;
    setLanguage(value);
  }

  return (
    <Select value={language} onValueChange={changeLanguage}>
      <SelectTrigger
        aria-label="Choose language"
        className="ring-brand h-11 gap-2 rounded-full border-hairline bg-transparent py-1 pr-1 pl-2.5 text-ink hover:bg-canvas/40 focus-visible:ring-2 focus-visible:ring-brand/60 [&>svg:last-child]:hidden"
      >
        <CountryFlag language={language} />
        <span className="sr-only">Language: </span>
        <span className="t-caption-strong pr-1 text-ink">
          {language}
        </span>
      </SelectTrigger>
      <SelectContent
        align="end"
        className="w-40 rounded-xl bg-canvas p-1.5 text-ink shadow-lg ring-1 ring-ink/10"
      >
        <SelectItem value="ENG" className="t-body-sm rounded-lg px-2.5 py-2 focus:bg-canvas-soft">
          English
        </SelectItem>
        <SelectItem value="FIL" className="t-body-sm rounded-lg px-2.5 py-2 focus:bg-canvas-soft">
          Filipino
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/**
 * DESIGN.md `nav-bar`: a sticky bar in ink on a light surface, links set in
 * body-sm-strong, and exactly one lime pill.
 *
 * Three tones:
 *
 *   `brand` — genuinely transparent, and NOT sticky. No background and no
 *             backdrop blur, so the hero's lime band and its dot field read
 *             straight through the bar. This only works because the hero pulls
 *             itself up underneath the header (see the negative margin on the
 *             landing page's hero); a transparent bar sitting in normal flow
 *             above the hero would reveal the page background, not the dots.
 *             Blur is off for the same reason — it would smear the dots it is
 *             meant to show. It scrolls away with the hero rather than sticking,
 *             which is also what keeps it legible: a transparent bar pinned to
 *             the viewport would later float over the two near-black bands with
 *             ink-coloured nav text on them.
 *
 *             It is still `relative`, not static, because it overlaps the hero
 *             and needs a stacking position for `z-50` to beat it. Static would
 *             let the lime band paint straight over the nav.
 *   `over`  — matches the sage hero band, so bar and hero read as one surface.
 *   `light` — the white bar on body pages.
 *
 * All three are light; the brand has no dark navigation. `brand` also swaps the
 * bar's CTA to the forest pill, because a lime pill on lime is the one pairing
 * DESIGN.md rules out outright.
 */
export function SiteHeader({
  tone = "light",
}: {
  tone?: "brand" | "over" | "light";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onBrand = tone === "brand";

  return (
    <header
      className={cn(
        "z-50 w-full",
        onBrand ? "relative" : "sticky top-0",
        onBrand && "bg-transparent",
        tone === "over" && "bg-canvas-soft/95 backdrop-blur-md",
        tone === "light" && "border-b border-hairline bg-canvas/95 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[75rem] items-center gap-6 px-5 sm:h-20 sm:px-8">
        <BrandMark strong />

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

        <div className="flex items-center gap-2 md:ml-8">
          <LanguageSelector />
          <ButtonLink
            variant={onBrand ? "onBrand" : "default"}
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
