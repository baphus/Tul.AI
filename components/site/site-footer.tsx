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

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div>
            <BrandMark />
            <p className="t-body mt-4 max-w-xs text-ink-mute text-pretty">
              Tul.AI bridges students to opportunities. From scholarships to what&apos;s
              next.
            </p>
            <p className="t-micro mt-6 text-ink-mute">
              AI assists. Verified information decides.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="t-micro text-ink">{column.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="ring-brand t-caption rounded-xs text-ink-mute hover:text-ink hover:underline hover:underline-offset-4"
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

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-ink-mute">
            © {new Date().getFullYear()} Tul.AI · Made for Filipino students
          </p>
          <p className="t-caption text-ink-mute">
            Prototype · demo scholarship data · not an official application portal
          </p>
        </div>
      </Container>
    </footer>
  );
}
