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
import { VerificationLedger } from "@/components/site/verification-ledger";
import { Button } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/logic/deadlines";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { getScholarships } from "@/lib/scholarships";

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

  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="canvas-indigo relative overflow-hidden pt-24 pb-14 sm:pt-28 md:pb-20 lg:pt-32">
          <Container width="wide">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7 xl:col-span-6">
                <h1 className="t-display-xxl enter max-w-[18ch] text-balance text-white">
                  Bridge to your next opportunity.
                </h1>
                <p className="t-body-lg enter enter-d1 mt-7 max-w-[54ch] text-on-dark-mute text-pretty">
                  {cards.length} verified scholarships worth{" "}
                  <span className="t-num text-white">{formatPeso(lowest)}</span> to{" "}
                  <span className="t-num text-white">{formatPeso(highest)}</span> each,
                  matched to your situation and shown with the published requirement behind
                  every single one.
                </p>

                <div className="enter enter-d2 mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
                  <Button
                    className="h-13 rounded-full bg-violet-soft px-7 text-indigo hover:bg-violet-soft/85"
                    render={<Link href={ROUTES.onboarding} />}
                  >
                    Find my scholarships
                  </Button>
                  <Link
                    href={ROUTES.scholarships}
                    className="ring-brand t-caption inline-flex items-center gap-1.5 rounded-xs text-on-dark-mute underline decoration-white/25 underline-offset-4 hover:text-white"
                  >
                    Or read all {cards.length} records first
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <p className="t-micro enter enter-d2 mt-6 text-on-dark-mute">
                  Five questions · no account · free for students
                </p>
              </div>

              <div className="lg:col-span-5 xl:col-span-6 xl:pl-10">
                <DeckPreview card={hero} index={0} className="enter-card" />
              </div>
            </div>

            {/* Proof, in the hero's own vicinity. */}
            <div className="enter enter-d4 mt-16 border-t border-hairline-dark/60 pt-7 md:mt-20">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <p className="t-caption max-w-[34ch] text-on-dark-mute">
                  Matched against the providers&apos; own published notices — last checked{" "}
                  {lastChecked && (
                    <time dateTime={lastChecked} className="text-white">
                      {formatIsoDate(lastChecked)}
                    </time>
                  )}
                  .
                </p>
                <ul className="flex flex-wrap items-center gap-3">
                  {cards.map((card, i) => (
                    <li key={card.id} className="flex items-center gap-2">
                      <ProviderCrest
                        index={i}
                        provider={card.provider}
                        className="size-8"
                      />
                      <span className="t-micro hidden text-on-dark-mute lg:inline">
                        {card.provider}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

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
                className="ring-brand t-body-strong inline-flex flex-none items-center gap-2 rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
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

        {/* ── The shift ────────────────────────────────────── */}
        <Section tone="soft" labelledBy="shift-heading">
          <Container>
            <SectionHead
              id="shift-heading"
              title="Scholarships aren't hidden. They're scattered."
              lead="Opportunities sit across government agencies, universities, LGUs and foundations, each with its own site, wording, documents and deadline. The gap isn't awareness — it's that nobody is holding the whole picture for one student."
            />

            <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
              <div className="md:border-r md:border-hairline md:pr-16">
                <h3 className="t-display-md text-ink-mute">Searching on your own</h3>
                <ol className="mt-6">
                  {OLD_WAY.map((item, i) => (
                    <li
                      key={item}
                      className="t-caption flex gap-4 border-b border-hairline py-3.5 text-ink-mute first:border-t"
                    >
                      <span className="t-num flex-none text-ink-mute">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="t-display-md">With Tul.AI</h3>
                <ol className="mt-6">
                  {NEW_WAY.map((item, i) => (
                    <li
                      key={item}
                      className="t-caption flex gap-4 border-b border-hairline py-3.5 text-ink first:border-t"
                    >
                      <span className="t-num flex-none text-indigo">
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
        <Section labelledBy="how-heading">
          <Container>
            <SectionHead
              id="how-heading"
              title="Where the AI is allowed to speak, and where it isn't."
              lead="The order matters, so here it is in order. Nothing about your eligibility is decided by a language model."
            />

            <ol className="mt-14">
              {STEPS.map(([title, body], i) => (
                <RuledRow key={title} last={i === STEPS.length - 1}>
                  <div className="flex items-baseline gap-4">
                    <span className="t-num t-caption flex-none text-ink-mute">
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
              className="ring-brand t-body-strong mt-10 inline-flex items-center gap-2 rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
            >
              The longer version, including what we refuse to do
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Container>
        </Section>

        {/* ── Explainability: the peak ─────────────────────── */}
        <Section tone="soft" size="loose" labelledBy="explain-heading">
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
                <figure className="rounded-xl border border-hairline bg-canvas p-6 sm:p-7">
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
                    className="ring-brand t-caption mt-6 inline-flex items-center gap-1.5 rounded-xs border-t border-hairline pt-6 text-indigo underline decoration-indigo/25 underline-offset-4"
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
        <Section labelledBy="discover-heading">
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

                <Button
                  className="mt-10 h-12 rounded-md px-6"
                  render={<Link href={ROUTES.discover} />}
                >
                  Try the deck with demo data
                </Button>
              </div>

              <div className="lg:col-span-6">
                <DeckPreview card={featured} index={1} controls />
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Institutions ─────────────────────────────────── */}
        <Section tone="soft" size="tight" labelledBy="inst-heading">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
              <div className="lg:col-span-8">
                <h2 id="inst-heading" className="t-display-lg max-w-[34ch] text-balance">
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
                <Link
                  href={ROUTES.institutions}
                  className="ring-brand t-body-strong inline-flex items-center gap-2 rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
                >
                  For institutions
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
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
