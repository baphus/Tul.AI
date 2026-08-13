import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { ClosingCta } from "@/components/site/closing-cta";
import { DeckPreview } from "@/components/site/deck-preview";
import {
  Container,
  RuledRow,
  Section,
  SectionHead,
} from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { SupportEstimator } from "@/components/site/support-estimator";
import { VerificationLedger } from "@/components/site/verification-ledger";
import { ButtonLink } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/logic/deadlines";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { getScholarships } from "@/lib/scholarships";

/**
 * The four things the product does, as DESIGN.md's four card surfaces: sage,
 * pale green, white, and the polarity-flipped dark card. The dark one carries
 * the promise the brand is most serious about, which is the one it refuses.
 */
const PILLARS: {
  title: string;
  body: string;
  href: string;
  cta: string;
  surface: "sage" | "green" | "white" | "dark";
}[] = [
  {
    title: "Discover",
    body: "One deck of opportunities drawn from national agencies, LGUs, universities and foundations — instead of six websites that each use different words.",
    href: ROUTES.discover,
    cta: "Open the deck",
    surface: "sage",
  },
  {
    title: "Understand",
    body: "Every match opens into the published requirement behind it, in plain language, with what is met, what needs attention, and what is simply unknown.",
    href: ROUTES.howItWorks,
    cta: "How matching works",
    surface: "green",
  },
  {
    title: "Verify",
    body: "Each record carries the official source and the date it was last checked. Ask Tul.AI to re-read that source while you are looking at it.",
    href: ROUTES.scholarships,
    cta: "See the records",
    surface: "white",
  },
  {
    title: "Apply with the provider",
    body: "Tul.AI takes you to the official application page and stops. It never applies on your behalf, and it never decides whether you get the scholarship.",
    href: ROUTES.howItWorks,
    cta: "What we refuse to do",
    surface: "dark",
  },
];

const STEPS: [string, string][] = [
  [
    "You answer five questions",
    "Where you study, what you study, how you're doing, your household, and anything else in your own words. Two of the five are required; the rest can stay blank without counting against you.",
  ],
  [
    "Tul.AI reads the providers",
    "Official notices from CHED, DOST-SEI, OWWA, Cebu LGUs and universities become structured records — eligibility, documents, deadline, application URL, source, and the date each was last checked.",
  ],
  [
    "A rules engine does the matching",
    "Plain comparisons, run by code: is your average at or above the published minimum, is your course on the eligible list, is your location in scope, is the deadline still open. The model is not consulted here.",
  ],
  [
    "The AI explains the result",
    "Only now does it write, putting the engine's answer into plain language with its sources attached. It cannot turn a requirement you fail into one you meet, or an unknown into a yes.",
  ],
  [
    "You apply with the provider",
    "Save what fits, work through the documents, then go to the official page. Tul.AI hands you off and stops — it never applies on your behalf.",
  ],
];

const OLD_WAY = [
  "Search Facebook and hope the post is current",
  "Ask friends who applied last year",
  "Open six agency sites that each use different words",
  "Download a PDF and read it twice",
  "Guess whether you qualify",
  "Find out after the deadline",
];

const NEW_WAY = [
  "Answer five questions, once",
  "See the programmes your situation actually fits",
  "Read the published requirement behind every match",
  "See the source, and the day it was last checked",
  "Know what is unknown, not just what is missing",
  "Reach the official application with time to prepare",
];

const FAQ: [string, string][] = [
  [
    "Is Tul.AI the official application portal?",
    "No. Tul.AI is a discovery and guidance layer. Every application is completed with the scholarship provider, who makes the final decision. We link you to their official page and stop there.",
  ],
  [
    "Does Tul.AI decide whether I'm eligible?",
    "No. A rules engine compares your answers against each published requirement and reports met, needs attention, or unknown. The AI explains that result in plain language — it never overrides it, and unknown never means ineligible.",
  ],
  [
    "Why is there no match percentage?",
    "Because a number like 97.8% would be invented. You get a count you can audit — eight of nine published requirements met — and you can open each one to read the requirement itself.",
  ],
  [
    "How current is the information?",
    "Every record carries a verification state and the date it was last checked against the provider's own source. You can ask Tul.AI to re-read a source while you're looking at a programme, and anything we can't confirm is labelled rather than smoothed over.",
  ],
  [
    "What happens to what I tell you?",
    "In this prototype it stays in your browser on this device, and it is only used to match you against published requirements. You can view, edit or delete all of it from your profile. We never sell student data.",
  ],
  [
    "Why so few scholarships?",
    "Coverage is deliberately narrow and Cebu-first while we prove the quality of each record. A small verified set is worth more to a student than a large index they can't trust.",
  ],
];

const SURFACE: Record<string, string> = {
  sage: "bg-canvas-soft text-ink",
  green: "bg-brand-pale text-ink",
  white: "bg-canvas text-ink border border-hairline",
  dark: "bg-ink text-white",
};

export default async function LandingPage() {
  const cards = await getScholarships();
  const hero = cards[0];
  const featured = cards[1];

  /* A range, not a total: these amounts are per year for some programmes and
     per semester for others, so summing them would overstate what a student
     could actually receive. */
  const amounts = cards.map((card) => card.amount);
  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  const lastChecked = cards
    .map((card) => card.lastVerified)
    .sort()
    .at(-1);
  const verified = cards.filter((card) => card.verification === "Verified").length;

  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────
            DESIGN.md `hero-band`: sage canvas, display-mega headline left, the
            signature card right. Stacks on mobile. */}
        <section className="canvas-sage pt-10 pb-16 md:pt-16 md:pb-24">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-6">
                <h1 className="t-display-xxl enter max-w-[12ch] text-balance text-ink">
                  Money for school, found.
                </h1>
                {/* {verified} not {cards.length}: the trust strip below states
                    how many are source-confirmed, and the two must agree. */}
                <p className="t-body-lg enter enter-d1 mt-8 max-w-[46ch] text-ink-mute text-pretty">
                  {cards.length} scholarships worth{" "}
                  <span className="t-num text-ink">{formatPeso(lowest)}</span> to{" "}
                  <span className="t-num text-ink">{formatPeso(highest)}</span> each,{" "}
                  {verified} of them confirmed against an official source — each shown
                  with the published requirement behind it.
                </p>

                <div className="enter enter-d2 mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ButtonLink
                    className="t-body-strong h-13 px-7 text-base"
                    href={ROUTES.onboarding}
                  >
                    Find my scholarships
                  </ButtonLink>
                  <ButtonLink
                    variant="tertiary"
                    className="t-body-strong h-13 px-7 text-base"
                    href={ROUTES.scholarships}
                  >
                    Read all {cards.length} records
                  </ButtonLink>
                </div>

                <p className="t-caption enter enter-d2 mt-6 text-ink-mute">
                  Five questions · no account · free for students
                </p>
              </div>

              <div className="lg:col-span-6 lg:pl-8">
                <SupportEstimator cards={cards} className="enter-card" />
              </div>
            </div>
          </Container>
        </section>

        {/* ── Trust strip ──────────────────────────────────── */}
        <section className="border-b border-hairline bg-canvas py-8" aria-label="Sources">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <p className="t-caption max-w-[40ch] text-ink-mute text-pretty">
                Matched against the providers&apos; own published notices —{" "}
                <span className="text-ink">
                  {verified} of {cards.length}
                </span>{" "}
                records confirmed against an official source, last checked{" "}
                {lastChecked && (
                  <time dateTime={lastChecked} className="text-ink">
                    {formatIsoDate(lastChecked)}
                  </time>
                )}
                .
              </p>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {cards.map((card, i) => (
                  <li key={card.id} className="flex items-center gap-2">
                    <ProviderCrest index={i} provider={card.provider} className="size-8" />
                    <span className="t-micro hidden text-ink-mute lg:inline">
                      {card.provider}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* ── The four things it does ──────────────────────── */}
        <Section labelledBy="pillars-heading">
          <Container>
            <SectionHead
              id="pillars-heading"
              title="Discover it. Understand it. Check it. Then go and apply."
              lead="Four jobs, in the order a student actually does them — and a hard stop at the point where the provider takes over."
            />

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {PILLARS.map((pillar) => (
                <div
                  key={pillar.title}
                  className={`flex flex-col rounded-xl p-6 sm:p-7 ${SURFACE[pillar.surface]}`}
                >
                  <h3
                    className={`t-display-lg ${pillar.surface === "dark" ? "text-brand" : "text-ink"}`}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className={`t-body mt-4 flex-1 text-pretty ${
                      pillar.surface === "dark" ? "text-on-dark-mute" : "text-ink-mute"
                    }`}
                  >
                    {pillar.body}
                  </p>
                  <Link
                    href={pillar.href}
                    className={`ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 rounded-xs underline underline-offset-4 ${
                      pillar.surface === "dark"
                        ? "text-brand decoration-brand/40 hover:decoration-brand"
                        : "text-ink decoration-hairline hover:decoration-ink"
                    }`}
                  >
                    {pillar.cta}
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── The figure band ──────────────────────────────── */}
        <Section tone="ink" size="tight" labelledBy="figure-heading">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="lg:col-span-7">
                <h2 id="figure-heading" className="t-display-xl text-balance text-brand">
                  {formatPeso(lowest)} to {formatPeso(highest)}, published and checked.
                </h2>
              </div>
              <p className="t-body-lg lg:col-span-5 text-on-dark-mute text-pretty">
                Not an estimate and not a projection — the figures each provider prints in
                its own notice, held next to the date we last confirmed them. Some are per
                year, some per semester; the record says which.
              </p>
            </div>
          </Container>
        </Section>

        {/* ── The shift ────────────────────────────────────── */}
        <Section labelledBy="shift-heading">
          <Container>
            <SectionHead
              id="shift-heading"
              title="Scholarships aren't hidden. They're scattered."
              lead="Opportunities sit across government agencies, universities, LGUs and foundations, each with its own site, wording, documents and deadline. The gap isn't awareness — it's that nobody is holding the whole picture for one student."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-canvas-soft p-6 sm:p-8">
                <h3 className="t-display-md text-ink-mute">Searching on your own</h3>
                <ol className="mt-5">
                  {OLD_WAY.map((item, i) => (
                    <li
                      key={item}
                      className="t-caption flex gap-4 border-t border-hairline py-3.5 text-ink-mute"
                    >
                      <span className="t-num flex-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl bg-brand-pale p-6 sm:p-8">
                <h3 className="t-display-md text-ink">With Tul.AI</h3>
                <ol className="mt-5">
                  {NEW_WAY.map((item, i) => (
                    <li
                      key={item}
                      className="t-caption flex gap-4 border-t border-ink/10 py-3.5 text-ink"
                    >
                      <span className="t-num flex-none text-ink-deep">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── How it works ─────────────────────────────────── */}
        <Section tone="soft" labelledBy="how-heading">
          <Container>
            <SectionHead
              id="how-heading"
              title="Where the AI is allowed to speak, and where it isn't."
              lead="The order matters, so here it is in order. Nothing about your eligibility is decided by a language model."
            />

            <ol className="mt-12">
              {STEPS.map(([title, body], i) => (
                <RuledRow key={title} last={i === STEPS.length - 1}>
                  <div className="flex items-baseline gap-4">
                    <span className="t-num t-caption-strong flex-none text-ink-mute">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="t-display-md">{title}</h3>
                  </div>
                  <p className="t-body max-w-[66ch] text-ink-mute text-pretty">{body}</p>
                </RuledRow>
              ))}
            </ol>

            <Link
              href={ROUTES.howItWorks}
              className="ring-brand t-body-strong mt-10 inline-flex items-center gap-2 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
            >
              The longer version, including what we refuse to do
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Container>
        </Section>

        {/* ── Explainability: the peak ─────────────────────── */}
        <Section size="loose" labelledBy="explain-heading">
          <Container>
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-6">
                <SectionHead
                  id="explain-heading"
                  title="Three answers, because two would be a lie."
                  lead="Most matchers give you a yes or a no. That forces every blank field into a rejection — the single most damaging thing a scholarship tool can do to a student. So there is a third answer, and it is not a softer no."
                />

                <dl className="mt-10">
                  {[
                    [
                      "ok",
                      "Requirement met",
                      "Your answer satisfies the requirement exactly as the provider published it.",
                    ],
                    [
                      "warn",
                      "Needs attention",
                      "There is a real condition left to satisfy — an exam to sit, a certificate to obtain, a membership to confirm. Actionable, not a refusal.",
                    ],
                    [
                      "none",
                      "Unknown",
                      "Either the provider hasn't published this detail, or you haven't told us that about yourself. It is never counted against you, and we say which of the two it is.",
                    ],
                  ].map(([state, term, description], i, all) => (
                    <div
                      key={term}
                      className={`flex gap-4 py-5 ${i === all.length - 1 ? "" : "border-b border-hairline"} ${i === 0 ? "border-t border-hairline" : ""}`}
                    >
                      <RequirementMark
                        state={state as "ok" | "warn" | "none"}
                        className="mt-0.5"
                      />
                      <div>
                        <dt className="t-body-strong">{term}</dt>
                        <dd className="t-caption mt-1.5 max-w-[62ch] text-ink-mute text-pretty">
                          {description}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="lg:col-span-6">
                <figure className="rounded-xl bg-canvas-soft p-6 sm:p-7">
                  <figcaption className="flex items-baseline justify-between gap-4 border-b border-hairline pb-5">
                    <span>
                      <span className="t-caption block text-ink-mute">{hero.provider}</span>
                      <span className="t-display-md mt-1 block">{hero.title}</span>
                    </span>
                    <span className="t-caption t-num flex-none text-ink-mute">
                      {hero.deadline}
                    </span>
                  </figcaption>

                  <MatchMetric card={hero} className="mt-6" />

                  <ul className="mt-6">
                    {hero.rows.map((row, i) => (
                      <li
                        key={row.label}
                        className={`flex gap-4 py-4 ${i === 0 ? "" : "border-t border-hairline"}`}
                      >
                        <RequirementMark state={row.state} className="mt-0.5" />
                        <div>
                          <p className="t-body-strong">{row.label}</p>
                          <p className="t-caption mt-1 text-ink-mute text-pretty">
                            {row.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ROUTES.scholarship(hero.id)}
                    className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 rounded-xs border-t border-hairline pt-6 text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                  >
                    Read the full record, sources and all
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </figure>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Discovery ────────────────────────────────────── */}
        <Section tone="soft" labelledBy="discover-heading">
          <Container>
            <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="lg:col-span-6">
                <SectionHead
                  id="discover-heading"
                  title="Light enough to explore. Serious where it counts."
                  lead="Sort one card at a time: interested, pass, or open the whole record. Nothing is discarded — everything you pass stays reachable, because a scholarship you skipped in ten seconds shouldn't disappear."
                />

                <dl className="mt-10">
                  <RuledRow>
                    <dt className="t-body-strong">Swiping is never the only way</dt>
                    <dd className="t-body max-w-[62ch] text-ink-mute text-pretty">
                      The same three actions are buttons, arrow keys and screen-reader
                      controls. Reduced-motion preferences turn the animation off without
                      taking the interaction with it.
                    </dd>
                  </RuledRow>
                  <RuledRow>
                    <dt className="t-body-strong">It notices what you can&apos;t</dt>
                    <dd className="t-body max-w-[62ch] text-ink-mute text-pretty">
                      Two national programmes you generally can&apos;t hold at once. Three
                      applications that want the same PSA certificate. Two deadlines
                      landing in the same fortnight.
                    </dd>
                  </RuledRow>
                  <RuledRow last>
                    <dt className="t-body-strong">Then it gets out of the way</dt>
                    <dd className="t-body max-w-[62ch] text-ink-mute text-pretty">
                      A checklist per application, the deadline in your own order, and the
                      official link. The decision was always the provider&apos;s.
                    </dd>
                  </RuledRow>
                </dl>

                <ButtonLink
                  className="t-body-strong mt-10 h-12 px-6 text-base"
                  href={ROUTES.discover}
                >
                  Try the deck with demo data
                </ButtonLink>
              </div>

              <div className="lg:col-span-6">
                <DeckPreview card={featured} index={1} controls />
              </div>
            </div>
          </Container>
        </Section>

        {/* ── The ledger ───────────────────────────────────── */}
        <Section labelledBy="ledger-heading">
          <Container>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <SectionHead
                id="ledger-heading"
                title="Every programme we've verified, and when."
                lead="Small enough to print in full, so we print it in full. This is the entire data set — no search box hiding how much we actually cover."
              />
              <Link
                href={ROUTES.scholarships}
                className="ring-brand t-body-strong inline-flex flex-none items-center gap-2 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
              >
                Open the directory
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12">
              <VerificationLedger cards={cards} />
            </div>

            <p className="t-caption mt-8 max-w-[70ch] text-ink-mute text-pretty">
              A record is only marked <span className="text-met">Verified</span> when an
              official provider source confirms it. Anything we could not confirm says{" "}
              <span className="text-attention-ink">Needs verification</span> and says why on
              its own page — a social-media post can help us find a programme, never
              establish its rules.
            </p>
          </Container>
        </Section>

        {/* ── Institutions ─────────────────────────────────── */}
        <Section tone="pale" size="tight" labelledBy="inst-heading">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
              <div className="lg:col-span-8">
                <h2 id="inst-heading" className="t-display-lg max-w-[30ch] text-balance">
                  A programme nobody eligible hears about is a budget line that quietly
                  under-delivers.
                </h2>
                <p className="t-body mt-5 max-w-[66ch] text-ink-mute text-pretty">
                  Universities, LGUs and foundations publish a programme once and let it
                  find the students who qualify — while the application, and the decision,
                  stay entirely with them.
                </p>
              </div>
              <div className="lg:col-span-4 lg:text-right">
                <ButtonLink
                  variant="tertiary"
                  className="t-body-strong h-12 px-6 text-base"
                  href={ROUTES.institutions}
                >
                  For institutions
                </ButtonLink>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Questions ────────────────────────────────────── */}
        <Section labelledBy="faq-heading">
          <Container>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <h2 id="faq-heading" className="t-display-xl text-balance">
                  Straight answers.
                </h2>
              </div>
              <div className="lg:col-span-8">
                {FAQ.map(([question, answer], i) => (
                  <details
                    key={question}
                    className={`group border-b border-hairline ${i === 0 ? "border-t" : ""}`}
                  >
                    <summary className="ring-brand t-display-md flex cursor-pointer list-none items-start gap-5 py-6 text-ink">
                      <span className="flex-1 max-w-[46ch]">{question}</span>
                      <PlusIcon
                        className="mt-1 size-4 flex-none text-ink-mute transition-transform duration-300 group-open:rotate-45"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="t-body max-w-[70ch] pb-7 text-ink-mute text-pretty">
                      {answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        <ClosingCta />
      </main>
    </>
  );
}
