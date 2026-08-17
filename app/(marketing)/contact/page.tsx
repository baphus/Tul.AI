import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/site/contact-form";
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
  title: "Contact",
  description:
    "Reach the Tul.AI team with a correction, a new scholarship, feedback, or a question about your data.",
};

const REASONS = [
  [
    "Report a wrong or expired detail",
    "A deadline moved, a requirement changed, or a link went dead? Tell us the scholarship and what you saw. We'll re-check against the official source and update the record with a new verification timestamp.",
  ],
  [
    "Suggest a scholarship",
    "Know an opportunity students should see? Send us the official page and anything you know about its requirements. We'll research it, tag its source, and add it only if it checks out.",
  ],
  [
    "Publish with Tul.AI",
    "Represent a provider — a university, LGU, foundation or agency? Get in touch and we'll help you list verified opportunities with the official application link in front of the students who qualify.",
  ],
  [
    "Your data",
    "A question about what we store, how to change it, or how to delete your profile. Short answer: everything lives on your device and you control it. More in the privacy page.",
  ],
  [
    "Feedback or a bug",
    "Something confusing, broken, or missing from your flow? We'd rather hear it now than find out later.",
  ],
] as const;

export default function ContactPage() {
  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        <section className="canvas-sage py-16 md:py-24 lg:py-28">
          <Container>
            <div className="grid items-start gap-12 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="t-eyebrow text-ink-mute">Contact Tul.AI</p>
                <h1 className="t-display-xxl mt-4 max-w-[14ch] text-balance text-ink">
                  We read every message.
                </h1>
                <p className="t-body-lg mt-7 max-w-[52ch] text-ink-mute text-pretty">
                  Whether it&apos;s a correction, a scholarship we should know about, or a
                  question about your data — write to us and we&apos;ll get back to you.
                </p>
                <p className="t-body mt-7 max-w-[52ch] text-ink-mute text-pretty">
                  Prefer to write directly? Email{" "}
                  <a
                    href="mailto:hello@tul.ai"
                    className="ring-brand rounded-xs text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                  >
                    hello@tul.ai
                  </a>
                  .
                </p>
              </div>
              <div className="lg:col-span-6">
                <ContactForm />
              </div>
            </div>
          </Container>
        </section>

        <Section id="reasons" tone="soft" labelledBy="reasons-heading">
          <Container>
            <SectionHead
              id="reasons-heading"
              title="What we're best at helping with."
              lead="The most useful things you can send us, and what happens after you do."
            />
            <dl className="mt-12 border-t border-hairline">
              {REASONS.map(([term, description], index) => (
                <RuledRow key={term} last={index === REASONS.length - 1}>
                  <dt className="t-display-md">{term}</dt>
                  <dd className="t-body max-w-[58ch] text-ink-mute text-pretty">
                    {description}
                  </dd>
                </RuledRow>
              ))}
            </dl>
          </Container>
        </Section>

        <Section labelledBy="expectations-heading">
          <Container>
            <SectionHead
              id="expectations-heading"
              title="What to expect."
              lead="A few honest notes about how we respond."
            />
            <ul className="mt-12">
              {[
                "We reply to every message that needs one, usually within a few working days.",
                "Tul.AI is a discovery and guidance layer — we can't decide applications, fast-track them, or answer for a provider. Questions about a specific application go to the provider listed on the record.",
                "Corrections to scholarship details are re-verified against the official source before they change a record. A report isn't an edit.",
                "There are no accounts yet and nothing is stored on our servers — so messages about your data are usually answered by pointing you to the profile page.",
              ].map((item, i) => (
                <li
                  key={item}
                  className={`t-body max-w-[70ch] py-5 text-ink-mute text-pretty ${i === 0 ? "border-t border-hairline" : ""} border-b border-hairline`}
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="t-caption mt-8 text-ink-mute">
              Prefer a public conversation? Reach us on the{" "}
              <Link
                href={ROUTES.roadmap}
                className="ring-brand rounded-xs text-ink underline decoration-ink/25 underline-offset-4"
              >
                roadmap page
              </Link>{" "}
              to tell us what opportunity you need.
            </p>
          </Container>
        </Section>

        <ClosingCta
          title="Prefer to find something first?"
          body="Start with your story, and we'll match you to verified opportunities with their official sources beside them."
          cta="Find my scholarships"
          href={ROUTES.onboarding}
        />
      </main>
    </>
  );
}