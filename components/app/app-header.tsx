"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/site/brand";
import { ROUTES } from "@/lib/logic/routes";
import { useTranslation } from "@/lib/logic/language";
import { cn } from "@/lib/utils";

const NAV = [
  { href: ROUTES.discover, label: "discover" },
  { href: ROUTES.profile, label: "profile" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 flex-none border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center gap-4 px-5 sm:px-8">
        <BrandMark strong />

        <nav
          className="sc -mx-1 ml-auto flex items-center gap-1 overflow-x-auto px-1"
          aria-label={t("appSections")}
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ring-brand t-caption rounded-full px-3.5 py-2 whitespace-nowrap transition-colors",
                  active
                    ? "bg-ink/6 text-ink"
                    : "text-ink-mute hover:bg-canvas-soft hover:text-ink"
                )}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Calm chrome for the onboarding conversation: mark, and a way out. */
export function OnboardingHeader() {
  const { t } = useTranslation();
  return (
    <header className="flex-none">
      <div className="mx-auto flex h-16 w-full max-w-[46rem] items-center px-5 sm:h-18 sm:px-8">
        <BrandMark strong />
        <Link
          href={ROUTES.home}
          className="ring-brand t-caption ml-auto rounded-xs text-ink-mute hover:text-ink"
        >
          {t("saveExit")}
        </Link>
      </div>
    </header>
  );
}
