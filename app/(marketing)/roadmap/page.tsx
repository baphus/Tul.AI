import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  CircleDollarSignIcon,
  GraduationCapIcon,
  HandshakeIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import { Container, Section } from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Tul.AI starts with scholarship matching and is exploring more verified opportunities for Filipino students.",
};

const EXPLORING: { title: string; body: string; Icon: LucideIcon }[] = [
  { title: "Internships", body: "Roles that turn classroom learning into real-world experience.", Icon: BriefcaseBusinessIcon },
  { title: "Grants & financial aid", body: "More ways to fund the education and work that move you forward.", Icon: CircleDollarSignIcon },
  { title: "Student jobs", body: "Flexible work opportunities that fit around study.", Icon: GraduationCapIcon },
  { title: "Competitions", body: "Challenges, awards, and platforms to put your skills into practice.", Icon: TrophyIcon },
  { title: "Mentorship", body: "People and programmes that make the next step feel less unknown.", Icon: HandshakeIcon },
];

export default function RoadmapPage() {
  return (
    <>
      <SiteHeader tone="over" />
      <main id="main" className="flex-1">
        <section className="canvas-sage overflow-hidden py-16 md:py-24 lg:py-32">
          <Container>
            <div className="grid items-end gap-12 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="t-eyebrow text-ink-mute">The Tul.AI roadmap</p>
                <h1 className="t-display-xxl mt-4 max-w-[13ch] text-balance text-ink">
                  More doors should be easier to find.
                </h1>
              </div>
              <p className="t-body-lg max-w-[30ch] text-ink-mute text-pretty lg:col-span-4 lg:pb-2">
                We&apos;re starting with scholarships, then expanding toward the opportunities
                that help students shape what comes next.
              </p>
            </div>
          </Container>
        </section>

        <Section id="available" labelledBy="available-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <p className="t-eyebrow text-ink-mute">Available now</p>
                <h2 id="available-heading" className="t-display-xl mt-3 text-balance">
                  Scholarship matching, in beta.
                </h2>
              </div>
              <div className="rounded-xl bg-brand-pale p-7 sm:p-10 lg:col-span-8">
                <p className="t-display-sm max-w-[26ch] text-balance">
                  Tell us about your studies. We&apos;ll help you find opportunities worth a
                  closer look.
                </p>
                <ul className="mt-8 grid gap-4 border-t border-ink/15 pt-6 sm:grid-cols-3">
                  {[
                    "Matches explain which published requirements you meet.",
                    "Unknown details stay unknown—never treated as a rejection.",
                    "Applications always continue on the official provider site.",
                  ].map((point) => (
                    <li key={point} className="t-caption text-ink text-pretty">{point}</li>
                  ))}
                </ul>
                <ButtonLink href={ROUTES.onboarding} className="mt-8 h-12 px-6">
                  Find my scholarships <ArrowRightIcon aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </Container>
        </Section>

        <Section id="exploring" tone="soft" labelledBy="exploring-heading">
          <Container>
            <div className="max-w-[44rem]">
              <p className="t-eyebrow text-ink-mute">Exploring next</p>
              <h2 id="exploring-heading" className="t-display-xl mt-3 text-balance">
                The opportunities around your education matter too.
              </h2>
              <p className="t-body-lg mt-6 text-ink-mute text-pretty">
                These are areas we&apos;re learning about with students—not a launch order or a
                promise. The needs we hear most will guide what we build.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXPLORING.map(({ title, body, Icon }, index) => (
                <li key={title} className="rounded-xl bg-canvas p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="size-6 text-ink" aria-hidden="true" />
                    <span className="t-micro text-ink-mute">0{index + 1}</span>
                  </div>
                  <h3 className="t-display-xs mt-12">{title}</h3>
                  <p className="t-caption mt-3 text-ink-mute text-pretty">{body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        <Section id="future-direction" tone="ink" labelledBy="direction-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="t-eyebrow text-brand">Future direction</p>
                <h2 id="direction-heading" className="t-display-xl mt-3 max-w-[18ch] text-balance text-white">
                  One trusted starting point for student opportunity.
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="t-body-lg text-on-dark-mute text-pretty">
                  Whatever form an opportunity takes, our standard stays the same: clear
                  requirements, credible sources, and a direct path to the people who make
                  the decision.
                </p>
                <a
                  className="ring-brand t-body-strong mt-7 inline-flex items-center gap-2 rounded-xs text-brand underline decoration-brand/40 underline-offset-4 hover:text-white"
                  href="mailto:hello@tul.ai?subject=Opportunity%20request%20for%20Tul.AI"
                >
                  Tell us what opportunity you need <ArrowRightIcon className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Container>
        </Section>

        <ClosingCta
          title="Start with the opportunity in front of you."
          body="Build your scholarship profile, understand your matches, then apply with the provider when you&apos;re ready."
          cta="Explore scholarships"
          href={ROUTES.onboarding}
        />
      </main>
    </>
  );
}
