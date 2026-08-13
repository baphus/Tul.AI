import {
  ArrowRightIcon,
  BanknoteIcon,
  ExternalLinkIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { ClosingCta } from "@/components/site/closing-cta";
import { DeckPreview } from "@/components/site/deck-preview";
import { DotGrid } from "@/components/site/dot-grid";
import {
  InstitutionList,
  InstitutionMarquee,
} from "@/components/site/institution-marquee";
import { Container, Section, SectionHead } from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { SupportEstimator } from "@/components/site/support-estimator";
import { ButtonLink } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/logic/deadlines";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { getScholarships } from "@/lib/scholarships";

/*
 * The landing page, laid out against wise.com's own section order — centred
 * hero, trust stats, the signature card, a two-up with a figure in each card,
 * the reassurance split, a three-up expansion, four attributed cards, the
 * mission moment, the phone block, the coverage wall, then the dark close.
 *
 * Three of Wise's slots assert things Tul.AI does not have — customer
 * testimonials, planetary scale, a shipped app. Those are not filled with
 * plausible-looking stand-ins. The testimonial slot keeps the four-card
 * rhythm but attributes each card to the provider source it was read from;
 * the scale slot states the actual size of the data set; the app slot shows
 * the deck on a phone and omits the store badges. A fabricated review or a
 * fake app-store badge would be a false claim about the product, which no
 * amount of visual fidelity buys back.
 *
 * Every figure on this page is computed from getScholarships() below rather
 * than typed into the copy, so the page cannot drift from the data set.
 *
 * History
 *   v1.0.0  Initial landing page (split hero, pillars, shift, steps, ledger).
 *   v2.0.0  Restructured section-for-section against wise.com: centred hero,
 *           stat trio, coverage marquee, provider-attributed cards, mission
 *           band. `STEPS`, `OLD_WAY`/`NEW_WAY` and the ledger section removed
 *           — /how-it-works already carries the pipeline and the directory
 *           carries the full record list.
 */

/** Wise's three-up expansion, as the three jobs and the one hard stop. */
const PILLARS: { title: string; body: string; href: string; cta: string }[] = [
  {
    title: "Discover",
    body: "One deck drawn from national agencies, LGUs, universities and foundations — instead of six websites that each use different words for the same requirement.",
    href: ROUTES.discover,
    cta: "Open the deck",
  },
  {
    title: "Understand",
    body: "Every match opens into the published requirement behind it, in plain language, with what is met, what needs attention, and what is simply unknown.",
    href: ROUTES.howItWorks,
    cta: "How matching works",
  },
  {
    title: "Apply with the provider",
    body: "Tul.AI takes you to the official application page and stops. It never applies on your behalf, and it never decides whether you get the scholarship.",
    href: ROUTES.howItWorks,
    cta: "What we refuse to do",
  },
];

const ANSWERS: [state: "ok" | "warn" | "none", term: string, description: string][] = [
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
  const verified = cards.filter((card) => card.verification === "Verified").length;

  /* Wise's third stat is round-the-clock support. Ours is the refusal, because
     the thing a student most needs to know about this product is where it
     stops. "Never" is the figure. */
  const STATS: [
    Icon: typeof BanknoteIcon,
    figure: string,
    label: string,
    body: string,
  ][] = [
    [
      BanknoteIcon,
      `${formatPeso(lowest)}–${formatPeso(highest)}`,
      "Published per student",
      "The figures each provider prints in its own notice — some per academic year, some per semester. Every record says which of the two it is.",
    ],
    [
      ShieldCheckIcon,
      `${verified} of ${cards.length}`,
      "Confirmed against an official source",
      lastChecked
        ? `Last checked ${formatIsoDate(lastChecked)}. The rest say “needs verification” and say why on their own page.`
        : "The rest say “needs verification” and say why on their own page.",
    ],
    [
      ExternalLinkIcon,
      "Never",
      "Applies on your behalf",
      "Tul.AI takes you to the provider's official page and stops. The application, and the decision, stay entirely with them.",
    ],
  ];

  return (
    <>
      {/* `brand`, so the bar is the same lime as the hero and the two read as
          one surface — and so its CTA becomes the forest pill rather than a
          lime pill on lime. */}
      <SiteHeader tone="brand" />

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────
            wise.com sets its hero as one centred column: headline, one line of
            subcopy, one CTA. DESIGN.md `hero-band` supplies the surface, and
            the dot field sits between that surface and the content.

            No bottom padding: the band ends at the photograph, and the seam
            block below paints its own lower half white — see the note there. */}
        {/* The negative top margin is what makes the transparent header work:
            it slides the lime band — and the dot field painted across it — up
            underneath the bar, so the dots show through. The margins match the
            header's own height exactly (h-16, then h-20 from sm up), and the
            top padding carries that height plus the gap the headline wants, so
            the h1 sits clear of the nav rather than under it. */}
        <section className="relative -mt-16 overflow-hidden bg-brand pt-28 text-center sm:-mt-20 sm:pt-32 md:pt-40">
          {/* Recoloured for the lime band: dots one step darker than the
              surface, resolving toward the brand's forest ink near the pointer.
              A darkening ripple rather than a new hue — the palette stays where
              DESIGN.md leaves it. */}
          <DotGrid baseColor="#86d95a" activeColor="#163300" />
          <Container className="relative">
            {/* `t-hero`, not `t-display-xxl`: the compressed face on the one
                element that carries it. A wider measure than the Manrope
                version had — narrower glyphs mean 20ch was becoming a tall
                column rather than a headline. */}
            <h1 className="t-hero enter mx-auto max-w-[26ch] text-balance uppercase text-ink-deep">
              Your next opportunity is closer than you think.
            </h1>
            {/* Deliberately factual under AGENTS.md §3: the headline says an
                opportunity is near, and this line says what is actually on
                offer, so the pair cannot be read as a promised award. */}
            {/* `ink-deep`, matching the headline — and emphatically not
                `ink-mute`, which falls to roughly 3:1 on lime and would fail
                WCAG 1.4.3 as body text. */}
            <p className="t-body-lg enter enter-d1 mx-auto mt-7 max-w-[54ch] text-ink-deep text-pretty">
              {cards.length} scholarships from national agencies, LGUs and universities —
              each shown with the published requirement behind it, the official source, and
              the date we last checked it.
            </p>

            <div className="enter enter-d2 mt-9 flex justify-center">
              <ButtonLink
                variant="onBrand"
                className="t-body-strong h-13 px-7 text-base"
                href={ROUTES.onboarding}
              >
                Find my scholarships
              </ButtonLink>
            </div>
          </Container>

          {/*
           * The seam. The photograph's own midline is the boundary between the
           * lime band and the white one, at every viewport width, with no
           * magic numbers and no negative margins:
           *
           *   - this wrapper contains nothing but the image, so its height IS
           *     the image's height (Container carries no vertical padding, and
           *     preflight makes the img a block, so there is no baseline gap);
           *   - therefore `h-1/2` on the white plate below is exactly half the
           *     photograph's height, and its top edge is exactly the midline;
           *   - the plate is painted before the Container in DOM order, so the
           *     photograph sits on top of it rather than under it.
           *
           * Capped at the file's native 1024px — wider and a 1024×536 source
           * is being upscaled. `priority` because it is the LCP element.
           */}
          <div className="relative mt-14 md:mt-16">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/2 bg-canvas"
            />
            <Container className="relative">
              <Image
                src="/hero-pic.png"
                alt="Four students walking together on a campus path, looking at a phone one of them is holding."
                width={1024}
                height={536}
                priority
                sizes="(min-width: 1088px) 64rem, 100vw"
                className="enter enter-d3 mx-auto w-full max-w-5xl rounded-xl"
              />
            </Container>
          </div>
        </section>

        {/* ── Trust stats ──────────────────────────────────────
            Wise's ₱923bn / Regulated / 24-7 trio, in the brand's own treatment
            for it: a centred uppercase opener, then three columns carrying a
            lime disc icon rather than sitting in cards. Every figure here is
            derived from the data set above, not written into the copy. */}
        <Section labelledBy="stats-heading">
          <Container>
            <h2
              id="stats-heading"
              className="t-display-xl mx-auto max-w-[24ch] text-center text-balance uppercase"
            >
              Take the guesswork out of paying for school
            </h2>

            <dl className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
              {STATS.map(([Icon, figure, label, body]) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-brand text-ink">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <dt className="t-figure mt-6 text-ink">{figure}</dt>
                  <dd>
                    <p className="t-body-strong mt-3 text-ink">{label}</p>
                    <p className="t-caption mx-auto mt-2 max-w-[38ch] text-ink-mute text-pretty">
                      {body}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>

        {/* ── The signature card ───────────────────────────────
            Wise puts its calculator on a full-strength lime band, copy left and
            the white card right. Same here — and the card keeps its own lime
            CTA inside, because there it sits on white. */}
        <Section tone="brand" labelledBy="estimator-heading">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <h2 id="estimator-heading" className="t-display-xl text-balance">
                  See what&apos;s actually on the table.
                </h2>
                <p className="t-body-lg mt-6 max-w-[46ch] text-ink text-pretty">
                  A description of what these providers publish — not an eligibility
                  check, and not a projection of what you would receive.
                </p>
                <ButtonLink
                  variant="onBrand"
                  className="t-body-strong mt-8 h-12 px-6 text-base"
                  href={ROUTES.scholarships}
                >
                  Browse every record
                </ButtonLink>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <SupportEstimator cards={cards} />
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Two-up, a figure in each ─────────────────────────
            Wise's "22 currencies" / "231 countries" pair. */}
        <Section labelledBy="what-heading">
          <Container>
            <h2
              id="what-heading"
              className="t-display-xl mx-auto max-w-[22ch] text-center text-balance uppercase"
            >
              Do more than find it. Understand it.
            </h2>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col rounded-xl bg-canvas-soft p-6 sm:p-8">
                <h3 className="t-display-lg text-ink">Read the requirement, not a score</h3>
                <p className="t-body mt-4 flex-1 text-ink-mute text-pretty">
                  No invented percentage. Each match reports how many of the provider&apos;s
                  own published requirements you meet, and every one of them opens.
                </p>
                <p className="t-figure mt-8 text-ink">3 answers</p>
                <p className="t-caption mt-2 text-ink-mute">
                  met · needs attention · unknown
                </p>
                <Link
                  href={ROUTES.howItWorks}
                  className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                >
                  How matching works
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="flex flex-col rounded-xl bg-brand-pale p-6 sm:p-8">
                <h3 className="t-display-lg text-ink">Every record carries its source</h3>
                <p className="t-body mt-4 flex-1 text-ink-mute text-pretty">
                  The official page it was read from, the tier of that source, and the day
                  it was last checked. You can ask Tul.AI to re-read it while you look.
                </p>
                <p className="t-figure mt-8 text-ink">
                  {cards.length} of {cards.length}
                </p>
                <p className="t-caption mt-2 text-ink-mute">
                  records sourced and dated
                </p>
                <Link
                  href={ROUTES.scholarships}
                  className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                >
                  See the records
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── The reassurance split ────────────────────────────
            Wise's "Disappoint thieves" slot: the section that addresses the
            fear. A student's fear here is being wrongly ruled out. */}
        <Section tone="soft" size="loose" labelledBy="explain-heading">
          <Container>
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-6">
                <SectionHead
                  id="explain-heading"
                  title="Unknown is not a no."
                  lead="Most matchers give you a yes or a no. That forces every blank field into a rejection — the single most damaging thing a scholarship tool can do to a student. So there is a third answer, and it is not a softer no."
                />

                <dl className="mt-10">
                  {ANSWERS.map(([state, term, description], i, all) => (
                    <div
                      key={term}
                      className={`flex gap-4 py-5 ${i === all.length - 1 ? "" : "border-b border-hairline"} ${i === 0 ? "border-t border-hairline" : ""}`}
                    >
                      <RequirementMark state={state} className="mt-0.5" />
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
                <figure className="rounded-xl bg-canvas p-6 sm:p-7">
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

        {/* ── Three-up expansion ──────────────────────────────── */}
        <Section labelledBy="pillars-heading">
          <Container>
            <SectionHead
              id="pillars-heading"
              align="center"
              caps
              title="Discover it. Understand it. Then go and apply."
              lead="Three jobs, in the order a student actually does them — and a hard stop at the point where the provider takes over."
            />

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="flex flex-col">
                  <h3 className="t-display-lg text-ink">{pillar.title}</h3>
                  <p className="t-body mt-4 flex-1 text-ink-mute text-pretty">
                    {pillar.body}
                  </p>
                  <Link
                    href={pillar.href}
                    className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 self-start rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                  >
                    {pillar.cta}
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Four attributed cards ────────────────────────────
            Wise's four Trustpilot cards. Tul.AI has no customers to quote, so
            the slot keeps the shape and changes the speaker: each card is what
            a provider publishes about its own programme, attributed to the
            source it was read from and the day it was checked. The crest sits
            where Wise puts a country flag. */}
        <Section tone="soft" labelledBy="providers-heading">
          <Container>
            <SectionHead
              id="providers-heading"
              caps
              title="For students going places."
              lead="Summarised from each provider's own notice — with the source we read it from, and when."
            />

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.slice(0, 4).map((card, index) => (
                <li
                  key={card.id}
                  className="flex flex-col rounded-xl bg-canvas p-6"
                >
                  <ProviderCrest
                    index={index}
                    provider={card.provider}
                    className="size-10"
                  />
                  <p className="t-body mt-5 flex-1 text-ink text-pretty">
                    {card.back.about}
                  </p>
                  <p className="t-caption mt-6 border-t border-hairline pt-5 text-ink-mute">
                    {card.sources[0]?.name} · Tier {card.sourceTier} source · checked{" "}
                    <time dateTime={card.lastVerified}>
                      {formatIsoDate(card.lastVerified)}
                    </time>
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>

        {/* ── The mission moment ───────────────────────────────
            Wise's "Meet money without borders" + globe. No illustration here:
            the photograph moved to the hero, and inventing a second image to
            fill the slot would be decoration. One centred statement carries
            it, which is what the band is for. */}
        <Section labelledBy="mission-heading">
          <Container>
            <div className="mx-auto max-w-184 text-center">
              <h2 id="mission-heading" className="t-display-xl text-balance uppercase">
                Opportunity, without the guesswork.
              </h2>
              <p className="t-body-lg mt-5 text-ink-mute text-pretty">
                Scholarships aren&apos;t hidden — they&apos;re scattered across agencies,
                universities, LGUs and foundations that each use different words. Nobody
                was holding the whole picture for one student. Now something is.
              </p>
              <div className="mt-8 flex justify-center">
                <ButtonLink
                  variant="tertiary"
                  className="t-body-strong h-12 px-6 text-base"
                  href={ROUTES.howItWorks}
                >
                  How it works
                </ButtonLink>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── The phone block ──────────────────────────────────
            Wise's app-download slot, minus the QR code and the two store
            badges: there is no app to download, and a store badge that links
            nowhere is a claim we can't make. What's true is that the deck is
            built for a phone, so that is what this shows. */}
        <Section tone="soft" labelledBy="phone-heading">
          <Container>
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-6">
                <SectionHead
                  id="phone-heading"
                  title="Built for the phone in your hand."
                  lead="Sort one card at a time: interested, pass, or open the whole record. Nothing is discarded — everything you pass stays reachable, because a scholarship you skipped in ten seconds shouldn't disappear."
                />
                <p className="t-caption mt-8 max-w-[54ch] text-ink-mute text-pretty">
                  The same three actions are buttons, arrow keys and screen-reader
                  controls. Reduced-motion preferences turn the animation off without
                  taking the interaction with it.
                </p>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ButtonLink
                    className="t-body-strong h-12 px-6 text-base"
                    href={ROUTES.discover}
                  >
                    Try the deck with demo data
                  </ButtonLink>
                  <ButtonLink
                    variant="tertiary"
                    className="t-body-strong h-12 px-6 text-base"
                    href={ROUTES.onboarding}
                  >
                    Answer five questions
                  </ButtonLink>
                </div>
              </div>

              <div className="lg:col-span-6">
                <DeckPreview card={featured} index={1} controls />
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Coverage ─────────────────────────────────────────
            Wise's "Wise works nearly everywhere" wall of flags. The claim is
            inverted: not that coverage is vast, but that it is small, complete
            and printed in full. */}
        <Section tone="ink" labelledBy="coverage-heading">
          <Container>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <h2
                  id="coverage-heading"
                  className="t-display-xl max-w-[24ch] text-balance text-brand"
                >
                  Every institution we cover, and what they publish.
                </h2>
                <p className="t-body-lg mt-6 max-w-[46ch] text-on-dark-mute text-pretty">
                  All {cards.length} records we hold today — not a sample of a larger
                  index. Coverage is deliberately Cebu-first while we prove the quality of
                  each record, and it is small enough to print in full, so we print it in
                  full.
                </p>
                <Link
                  href={ROUTES.scholarships}
                  className="ring-brand t-body-strong mt-8 inline-flex items-center gap-2 rounded-xs text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
                >
                  Open the full directory
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="lg:col-span-7">
                <InstitutionMarquee cards={cards} />
                <InstitutionList cards={cards} />
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Questions ────────────────────────────────────────
            No counterpart on wise.com. Kept: six straight answers about what
            this product will and will not do is not a section to trade away
            for structural fidelity. */}
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
                      <span className="max-w-[46ch] flex-1">{question}</span>
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
