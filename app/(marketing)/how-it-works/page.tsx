import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import {
  Container,
  RuledRow,
  Section,
  SectionHead,
} from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { ROUTES } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Answer a few questions, understand why a scholarship fits, and apply with the official provider.",
};

const STEPS = [
  [
    "Tell us about you",
    "Answer a few questions about your studies, location and circumstances. You can always review and change your profile.",
  ],
  [
    "See what fits",
    "We compare your answers with each scholarship's published requirements and show why it may be worth your time.",
  ],
  [
    "Apply with the provider",
    "When you are ready, use the official application link. Tul.AI helps you discover opportunities; the provider handles the application and decision.",
  ],
] as const;

const PROMISES = [
  [
    "Verified information leads",
    "Every record shows its source, verification status and the date it was last checked.",
  ],
  [
    "Unknown stays unknown",
    "If a requirement is missing from your profile or has not been published, we say so. It never counts as a rejection.",
  ],
  [
    "AI explains, it does not decide",
    "Matching comes from the published requirements. AI only helps put the result into plain language.",
  ],
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        <section className="canvas-sage py-16 md:py-24 lg:py-28">
          <Container>
            <h1 className="t-display-xxl max-w-[16ch] text-balance text-ink">
              Find opportunities you can act on.
            </h1>
            <p className="t-body-lg mt-7 max-w-[52ch] text-ink-mute text-pretty">
              Tul.AI turns scattered scholarship information into a clear next step,
              without guessing what you qualify for.
            </p>
          </Container>
        </section>

        <Section id="steps" labelledBy="steps-heading">
          <Container>
            <SectionHead
              id="steps-heading"
              title="Three simple steps."
              lead="Start with what you know. We will make the next step clear."
            />

            <ol className="mt-12 border-t border-hairline">
              {STEPS.map(([title, body], index) => (
                <li key={title}>
                  <RuledRow last={index === STEPS.length - 1}>
                    <h3 className="t-display-md">{title}</h3>
                    <p className="t-body max-w-[58ch] text-ink-mute text-pretty">{body}</p>
                  </RuledRow>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        <Section id="trust" tone="soft" labelledBy="trust-heading">
          <Container>
            <SectionHead
              id="trust-heading"
              title="Clear about what we know."
              lead="You should be able to see the information behind every recommendation."
            />

            <dl className="mt-12 border-t border-hairline">
              {PROMISES.map(([term, description], index) => (
                <RuledRow key={term} last={index === PROMISES.length - 1}>
                  <dt className="t-display-md">{term}</dt>
                  <dd className="t-body max-w-[58ch] text-ink-mute text-pretty">
                    {description}
                  </dd>
                </RuledRow>
              ))}
            </dl>
          </Container>
        </Section>

        <ClosingCta
          title="Start with your story."
          body="Answer a few questions and explore scholarships with their official sources beside them."
          cta="Find my scholarships"
          href={ROUTES.onboarding}
        />
      </main>
    </>
  );
}
