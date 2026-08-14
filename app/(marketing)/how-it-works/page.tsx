import type { Metadata } from "next";
import Link from "next/link";

import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { ClosingCta } from "@/components/site/closing-cta";
import {
  Container,
  RuledRow,
  Section,
  SectionHead,
} from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { ROUTES } from "@/lib/logic/routes";
import { getScholarships } from "@/lib/scholarships";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Tul.AI matches students to scholarships: a deterministic eligibility engine over structured requirements, AI for explanation only, and a verification state on every record.",
};

const PIPELINE: [string, string][] = [
  [
    "Your profile",
    "Five answers become structured attributes. If you write a sentence in your own words, the AI proposes fields from it — and you review them before anything is kept.",
  ],
  [
    "Structured requirements",
    "Each programme is stored as a record: eligibility, documents, deadline, application URL, official source, and verification state. Not a page of prose to re-read every time.",
  ],
  [
    "The eligibility engine",
    "Plain comparisons, run by code: GWA against the published minimum, course against the eligible list, location against the scope, deadline against today. Deterministic, and identical for every student.",
  ],
  [
    "Ranking",
    "Eligibility compatibility first, then deadline, then how relevant the programme is to your situation, then how complete and how reliable the underlying information is.",
  ],
  [
    "Explanation",
    "Only now does the AI write. It puts the engine's result into plain language and cites what it drew on. It cannot change a single met, unmet or unknown.",
  ],
];

const TIERS: [string, string][] = [
  ["Tier 1", "Official provider sources — government, university and LGU pages."],
  [
    "Tier 2",
    "Official documents — memoranda, application notices, programme guidelines.",
  ],
  ["Tier 3", "Trusted secondary sources."],
  [
    "Tier 4",
    "Informal sources — social posts, forums, blogs. Useful for discovering that a programme exists; never enough on their own to state a requirement or a deadline.",
  ],
];

const LIMITS = [
  "Submit applications for you, or create accounts on your behalf.",
  "Predict whether you'll be accepted, or rank your chances.",
  "Invent a requirement, a deadline or a programme. If it isn't published, it's unknown.",
  "Act as the official application portal, or replace your guidance office.",
  "Treat a missing answer as a failed requirement.",
];

export default async function HowItWorksPage() {
  const cards = await getScholarships();
  const example = cards[2];

  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        <section className="canvas-sage pt-10 pb-16 md:pt-16 md:pb-24">
          <Container>
            <h1 className="t-display-xxl max-w-[22ch] text-balance text-ink">
              AI assists. Verified information decides.
            </h1>
            <p className="t-body-lg mt-7 max-w-[52ch] text-ink-mute text-pretty">
              Ask a language model which scholarships you can apply for and it will answer
              confidently, fluently, and sometimes with a programme that does not exist.
              Tul.AI is built the other way round: structured data and deterministic rules
              produce the result, and the model is only allowed to explain it.
            </p>
          </Container>
        </section>

        <Section id="matching" labelledBy="matching-heading">
          <Container>
            <SectionHead
              id="matching-heading"
              title="What happens between your answers and a match."
              lead="Five stages, in this order. The model appears in the fifth."
            />
            <ol className="mt-14">
              {PIPELINE.map(([step, body], i) => (
                <RuledRow key={step} last={i === PIPELINE.length - 1}>
                  <div className="flex items-baseline gap-4">
                    <span className="t-num t-caption flex-none text-ink-mute">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="t-display-md">{step}</h3>
                  </div>
                  <p className="t-body max-w-[66ch] text-ink-mute text-pretty">{body}</p>
                </RuledRow>
              ))}
            </ol>
          </Container>
        </Section>

        <Section tone="soft" labelledBy="states-heading">
          <Container>
            <SectionHead
              id="states-heading"
              title="Unknown is its own answer."
              lead="Most tools quietly turn a blank field into a rejection. For a student deciding whether to bother applying, that is the most damaging thing a matcher can get wrong, so Tul.AI refuses to do it."
            />

            <dl className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
              {(
                [
                  [
                    "ok",
                    "Requirement met",
                    "Your information satisfies the requirement exactly as the provider published it.",
                  ],
                  [
                    "warn",
                    "Needs attention",
                    "A real condition is left to satisfy — an exam to sit, a document to obtain, a membership to confirm. Actionable, not a refusal.",
                  ],
                  [
                    "none",
                    "Unknown",
                    "Either the provider hasn't published this detail, or you haven't told us that about yourself. We say which, and it never counts against you.",
                  ],
                ] as const
              ).map(([state, term, description]) => (
                <div key={term} className="border-t border-hairline pt-6">
                  <dt className="flex items-center gap-3">
                    <RequirementMark state={state} />
                    <span className="t-display-md">{term}</span>
                  </dt>
                  <dd className="t-caption mt-3 text-ink-mute text-pretty">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="t-body mt-12 max-w-[70ch] text-ink-mute text-pretty">
              {example.provider} is the clearest example in the current set: the programme
              is live and the requirements are published, but the slot allocation for this
              cycle is not. That row stays unknown on every student&apos;s match rather
              than being guessed in either direction.
            </p>
            <p className="t-body mt-5 max-w-[70ch] text-ink-mute text-pretty">
              It is also why you will never see &ldquo;97.8% match&rdquo; here. You get a
              count you can audit — <span className="text-ink">eight of nine requirements
              met</span> — and one of four plain categories: strong, good, possible, or not
              currently eligible.
            </p>
          </Container>
        </Section>

        <Section id="verification" labelledBy="verification-heading">
          <Container>
            <SectionHead
              id="verification-heading"
              title="Sources over authority."
              lead="Sources are ranked, and the rank changes what a record is allowed to claim."
            />

            <dl className="mt-14">
              {TIERS.map(([tier, body], i) => (
                <RuledRow key={tier} last={i === TIERS.length - 1}>
                  <dt className="t-display-md">{tier}</dt>
                  <dd className="t-body max-w-[66ch] text-ink-mute text-pretty">{body}</dd>
                </RuledRow>
              ))}
            </dl>

            <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-16">
              <p className="t-body max-w-[62ch] text-ink-mute text-pretty">
                A scholarship cannot be marked <span className="text-met">Verified</span> on
                Tier 4 evidence alone. Every record shows its state and the date it was last
                checked, and you can ask Tul.AI to re-read the source while you are looking
                at it.
              </p>
              <p className="t-body max-w-[62ch] text-ink-mute text-pretty">
                Fetched pages are treated as untrusted data, never as instructions. A
                scholarship page cannot tell our research agent what to do, and it can never
                cause your information to be revealed.
              </p>
            </div>
          </Container>
        </Section>

        <Section id="limits" tone="soft" labelledBy="limits-heading">
          <Container>
            <SectionHead
              id="limits-heading"
              title="What Tul.AI will not do."
              lead="Some of these are permanent. All of them are deliberate."
            />
            <ul className="mt-12">
              {LIMITS.map((limit, i) => (
                <li
                  key={limit}
                  className={`t-body-lg max-w-[62ch] py-5 text-ink ${i === 0 ? "border-t border-hairline" : ""} border-b border-hairline`}
                >
                  {limit}
                </li>
              ))}
            </ul>
            <p className="t-caption mt-8 text-ink-mute">
              What we collect and why is set out on the{" "}
              <Link
                href={ROUTES.privacy}
                className="ring-brand rounded-xs text-ink underline decoration-ink/25 underline-offset-4"
              >
                privacy page
              </Link>
              .
            </p>
          </Container>
        </Section>

        <ClosingCta
          title="See it on a real record."
          body="Open any programme and read its requirements, its sources and its verification date for yourself."
          cta="Browse verified scholarships"
          href={ROUTES.scholarships}
        />
      </main>
    </>
  );
}
