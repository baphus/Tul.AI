import Link from "next/link";

import { BrandMark } from "@/components/site/brand";
import { Container } from "@/components/site/layout-primitives";
import { ROUTES } from "@/lib/logic/routes";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { href: ROUTES.scholarships, label: "All scholarships" },
      { href: ROUTES.onboarding, label: "Build your profile" },
      { href: ROUTES.discover, label: "Swipe deck" },
      { href: ROUTES.saved, label: "Saved & deadlines" },
    ],
  },
  {
    title: "Understand",
    links: [
      { href: ROUTES.howItWorks, label: "How it works" },
      { href: `${ROUTES.howItWorks}#matching`, label: "How matching works" },
      { href: `${ROUTES.howItWorks}#verification`, label: "How we verify" },
      { href: `${ROUTES.howItWorks}#limits`, label: "What we don't do" },
    ],
  },
  {
    title: "Institutions",
    links: [
      { href: `${ROUTES.institutions}#universities`, label: "Universities" },
      { href: `${ROUTES.institutions}#lgus`, label: "LGUs" },
      { href: `${ROUTES.institutions}#providers`, label: "Scholarship providers" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: ROUTES.privacy, label: "Privacy" },
      { href: `${ROUTES.privacy}#data`, label: "Your data" },
      { href: ROUTES.profile, label: "Edit or delete your profile" },
    ],
  },
];

/**
 * The legal bar. Every entry resolves to a page that exists — a legal bar of
 * plausible-looking dead links is worse than a short one, and the standing
 * disclosure that Tul.AI is not the application portal belongs here rather
 * than only in the fine print.
 */
const LEGAL: { href: string; label: string }[] = [
  { href: ROUTES.privacy, label: "Privacy policy" },
  { href: `${ROUTES.privacy}#data`, label: "Your data" },
  { href: `${ROUTES.howItWorks}#limits`, label: "What Tul.AI does not do" },
  { href: ROUTES.profile, label: "Edit or delete your data" },
];

/** DESIGN.md `footer`: the dark band. Ink surface, sage text, body-sm links. */
export function SiteFooter() {
  return (
    <footer className="canvas-ink border-t border-white/10 py-16 md:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div>
            <BrandMark tone="on-dark" />
            <p className="t-body mt-4 max-w-xs text-on-dark-mute text-pretty">
              Tul.AI bridges students to opportunities. From scholarships to what&apos;s
              next.
            </p>
            <p className="t-micro mt-6 text-brand">
              AI assists. Verified information decides.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="t-micro text-white">{column.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="ring-brand t-caption rounded-xs text-on-dark-mute hover:text-white hover:underline hover:underline-offset-4"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* The legal bar, as wise.com carries one: the standing obligations
            sit on their own rule, above the copyright line, so they are
            reachable from every page without hunting through a column. */}
        <div className="mt-14 border-t border-white/15 pt-8">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {LEGAL.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="ring-brand t-caption rounded-xs text-on-dark-mute hover:text-white hover:underline hover:underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-caption text-on-dark-mute">
              © {new Date().getFullYear()} Tul.AI · Made for Filipino students
            </p>
            <p className="t-caption text-on-dark-mute">
              Prototype · demo scholarship data · not an official application portal
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
