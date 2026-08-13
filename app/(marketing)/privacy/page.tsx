import type { Metadata } from "next";
import Link from "next/link";

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
  title: "Privacy",
  description:
    "What Tul.AI collects, why each field improves matching, and how a student can view, edit or delete everything.",
};

const FIELDS: { field: string; why: string; required: boolean }[] = [
  {
    field: "Where you study",
    why: "Most LGU and university programmes are restricted by residency or campus. Without this, location requirements can only ever be unknown.",
    required: true,
  },
  {
    field: "What you study",
    why: "Priority-course lists decide entire programmes — DOST-SEI's science and technology fields, or a province's list for this cycle.",
    required: true,
  },
  {
    field: "School and year level",
    why: "Some grants are administered by a single campus; others accept only certain year levels in a given cycle.",
    required: false,
  },
  {
    field: "Academic standing",
    why: "Merit programmes publish a numeric cut-off. Leaving your GWA blank makes those requirements unknown, never unmet.",
    required: false,
  },
  {
    field: "Household income and size",
    why: "Need-based programmes publish income ceilings, and a ceiling means something different for a household of two than for eight.",
    required: false,
  },
  {
    field: "Circumstances you choose to share",
    why: "4Ps, an OFW parent, a solo-parent household, PWD status or membership of an indigenous community each unlock specific programmes that would otherwise never surface.",
    required: false,
  },
  {
    field: "Anything else, in your own words",
    why: "Read once to propose structured fields, which you review before they are kept. We would rather store the reviewed field than the paragraph.",
    required: false,
  },
];

const RIGHTS = [
  "Your profile page shows every stored field in plain language, with nothing hidden behind a summary.",
  "Any answer can be changed or emptied at any time. Emptying a field makes the requirements that depend on it unknown — it never marks you ineligible.",
  "Deleting your profile removes it from this device immediately, with no soft delete and no shadow copy.",
  "We never sell student data, and we do not use it to train unrelated AI models without explicit consent.",
  "Sensitive data is encrypted in transit and at rest, administrative access is restricted, and sensitive operations are logged.",
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        <section className="canvas-indigo pt-28 pb-16 sm:pt-32 md:pb-24">
          <Container>
            <h1 className="t-display-xxl max-w-[24ch] text-balance text-white">
              We ask for the least that makes matching work.
            </h1>
            <p className="t-body-lg mt-7 max-w-[62ch] text-on-dark-mute text-pretty">
              Scholarship matching touches genuinely sensitive things — money, family
              circumstances, disability, indigenous identity. Every field below has to pass
              one test: does knowing this change which opportunities you can see? If not,
              we don&apos;t ask.
            </p>
          </Container>
        </section>

        <Section size="tight">
          <Container>
            <p className="t-body max-w-[70ch] border-l border-indigo pl-5 text-ink text-pretty">
              <span className="text-ink-mute">Prototype note.</span> This build has no
              accounts and no server-side database. Everything you enter stays in your own
              browser&apos;s local storage on this device, and clearing it removes the lot.
              The commitments below are what the product is being built to, and what the
              production version will be held to.
            </p>
          </Container>
        </Section>

        <Section id="data" tone="soft" labelledBy="fields-heading">
          <Container>
            <SectionHead
              id="fields-heading"
              title="What we ask, and why."
              lead="Two questions are required, because without them nothing can be matched at all. Everything else is yours to withhold."
            />

            <dl className="mt-14">
              {FIELDS.map((item, i) => (
                <RuledRow key={item.field} last={i === FIELDS.length - 1}>
                  <dt>
                    <span className="t-display-md block">{item.field}</span>
                    <span
                      className={
                        item.required
                          ? "t-micro mt-2 inline-block rounded-full border border-indigo/25 bg-indigo/6 px-2.5 py-0.5 text-indigo"
                          : "t-micro mt-2 inline-block text-ink-mute"
                      }
                    >
                      {item.required ? "Required" : "Optional"}
                    </span>
                  </dt>
                  <dd className="t-body max-w-[66ch] text-ink-mute text-pretty">
                    {item.why}
                  </dd>
                </RuledRow>
              ))}
            </dl>
          </Container>
        </Section>

        <Section labelledBy="rights-heading">
          <Container>
            <SectionHead
              id="rights-heading"
              title="You can see all of it, change all of it, and delete all of it."
            />
            <ul className="mt-12">
              {RIGHTS.map((item, i) => (
                <li
                  key={item}
                  className={`t-body max-w-[70ch] py-5 text-ink-mute text-pretty ${i === 0 ? "border-t border-hairline" : ""} border-b border-hairline`}
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="t-caption mt-8 text-ink-mute">
              Manage everything from your{" "}
              <Link
                href={ROUTES.profile}
                className="ring-brand rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
              >
                profile page
              </Link>
              .
            </p>
          </Container>
        </Section>

        <Section tone="soft" labelledBy="safety-heading">
          <Container>
            <SectionHead
              id="safety-heading"
              title="A scholarship page cannot talk to our AI."
              lead="Pages we fetch are data, never instructions."
            />
            <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-16">
              <p className="t-body max-w-[62ch] text-ink-mute text-pretty">
                A careless or malicious page could otherwise try to tell our research agent
                to ignore its rules and reveal what it knows about you. Retrieved content is
                extracted, validated and turned into structured fields before anything
                reaches a model&apos;s instructions.
              </p>
              <p className="t-body max-w-[62ch] text-ink-mute text-pretty">
                Your profile is never part of a context that a fetched page can influence.
                We also defend explicitly against fabricated application links, misleading
                scholarship sites, stale listings and duplicates.
              </p>
            </div>
            <p className="t-caption mt-8 text-ink-mute">
              More detail in{" "}
              <Link
                href={`${ROUTES.howItWorks}#verification`}
                className="ring-brand rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
              >
                how we verify
              </Link>
              .
            </p>
          </Container>
        </Section>

        <ClosingCta
          title="Start with two answers."
          body="You can see real matches after the first two questions, and stop there if you'd rather not share more."
        />
      </main>
    </>
  );
}
