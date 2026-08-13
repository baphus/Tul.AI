import {
  ArrowRightIcon,
  ExternalLinkIcon,
  HeartHandshakeIcon,
  PlusIcon,
  SearchCheckIcon,
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
import { Container, RuledRow, Section, SectionHead } from "@/components/site/layout-primitives";
import { OfferPills } from "@/components/site/offer-pills";
import { SiteHeader } from "@/components/site/site-header";
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

/**
 * The first reassurance after the hero. This is deliberately about the
 * student's experience, rather than a list of product features or metrics.
 */
const STUDENT_SUPPORT: {
  title: string;
  body: string;
  href: string;
  cta: string;
  Icon: typeof SearchCheckIcon;
}[] = [
  {
    title: "Start where you are",
    body: "You do not need to know every scholarship by name. Tell us a little about your path, and we will help you find a calm place to begin.",
    href: ROUTES.discover,
    cta: "Find your starting point",
    Icon: SearchCheckIcon,
  },
  {
    title: "Make sense of the details",
    body: "Requirements can be hard to read. We lay out what is clear, what may need attention, and what is still unknown without making assumptions about you.",
    href: ROUTES.howItWorks,
    cta: "See how we explain matches",
    Icon: HeartHandshakeIcon,
  },
  {
    title: "Take the next step your way",
    body: "When you are ready, we point you to the provider's official page. The application and decision stay with the people who run the scholarship.",
    href: ROUTES.howItWorks,
    cta: "How official applications work",
    Icon: ExternalLinkIcon,
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
    "What does the match percentage actually measure?",
    "Exactly one thing: the share of a provider's own published requirements your profile already meets — eight of nine is 89%. It is arithmetic you can audit, and every requirement behind it opens so you can read it yourself. What it is not is a prediction: it says nothing about your chance of being awarded the scholarship, and no AI produces it. Where a provider publishes nothing we can check, we say so instead of showing 0%.",
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

  /*
   * Records whose published benefit reduces to a figure. The adapter in
   * lib/scholarships.ts returns `amount: 0` when a provider states its benefit
   * in prose it cannot parse — 12 of the 32 records today — and sets
   * `amountNote` to "see provider details" instead. So anything on this page
   * that prints a peso figure must draw from `priced`, never from every record,
   * or the range collapses to "₱0 to …" and cards render a bare ₱0.
   */
  const priced = cards.filter((card) => card.amount > 0);

  /* Showcase records: the two full cards below quote a figure, so they have to
     come from `priced`. Falling back to the raw list keeps the page rendering
     if a future data set has no parseable amounts at all. */
  const hero = priced[0] ?? cards[0];
  const featured = priced[1] ?? priced[0] ?? cards[0];
  const sourceType = (card: (typeof cards)[number]) =>
    card.back.facts.find(([label]) => label === "Provider type")?.[1].toLowerCase() ?? "";
  const scholarshipSources = [
    {
      label: "Government",
      title: "Public support, published openly",
      body: "Scholarships from national agencies and local governments, with the official notice kept close at hand.",
      image: "/scholarship-sources/government.jpg",
      imageAlt: "Historic public building in Manila",
      imageClassName: "object-[center_38%]",
      records: cards.filter((card) => /government|agency|local/.test(sourceType(card))),
    },
    {
      label: "Schools",
      title: "Opportunities through schools",
      body: "Programs offered by schools and education partners for students taking the next step in their studies.",
      image: "/scholarship-sources/schools.jpg",
      imageAlt: "Three Filipino students studying together",
      imageClassName: "object-center",
      records: cards.filter((card) => /school|university/.test(sourceType(card))),
    },
    {
      label: "Foundations",
      title: "Backing from mission-led partners",
      body: "Foundation, nonprofit, corporate, and international programs that invest in students and communities.",
      image: "/scholarship-sources/foundations.jpg",
      imageAlt: "Filipino children walking to school",
      imageClassName: "object-[center_45%]",
      records: cards.filter((card) => !/government|agency|local|school|university/.test(sourceType(card))),
    },
  ];

  /* A range, not a total: these amounts are per year for some programmes and
     per semester for others, so summing them would overstate what a student
     could actually receive. */
  const amounts = priced.map((card) => card.amount);
  const lowest = amounts.length ? Math.min(...amounts) : 0;
  const highest = amounts.length ? Math.max(...amounts) : 0;
  const lastChecked = cards
    .map((card) => card.lastVerified)
    .sort()
    .at(-1);
  const verified = cards.filter((card) => card.verification === "Verified").length;

  const stats: [
    figure: string,
    label: string,
    body: string,
  ][] = [
    [
      `${formatPeso(lowest)}–${formatPeso(highest)}`,
      "Published per student",
      `The figures ${priced.length} of these ${cards.length} providers print in their own notices — some per academic year, some per semester, and each record says which. The rest describe their benefit in words we don't reduce to a number.`,
    ],
    [
      `${verified} of ${cards.length}`,
      "Confirmed against an official source",
      lastChecked
        ? `Last checked ${formatIsoDate(lastChecked)}. The rest say “needs verification” and say why on their own page.`
        : "The rest say “needs verification” and say why on their own page.",
    ],
    [
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
              {cards.length} scholarships from national agencies, LGUs, universities and
              foundations — each shown with the published requirement behind it, the
              official source, and the date we last checked it.
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
           * The photograph now runs the full container width rather than being
           * capped at its native 1024px. That is a ~17% upscale at desktop —
           * acceptable for a photograph, but it is the ceiling: see the note in
           * the report about supplying a larger source before going full-bleed.
           * `priority` because it is the LCP element.
           */}
          <div className="relative mt-14 md:mt-16">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/2 bg-canvas"
            />
            <Container className="relative">
              {/* This wrapper exists so the pills can be positioned against the
                  photograph itself. It holds nothing but the image and the
                  absolutely-positioned overlay, so the seam's height maths —
                  wrapper height == image height — still holds exactly. */}
              <div className="relative">
                <Image
                  src="/hero-pic.png"
                  alt="Four students walking together on a campus path, looking at a phone one of them is holding."
                  width={1024}
                  height={536}
                  priority
                  sizes="(min-width: 1264px) 75rem, 100vw"
                  className="enter enter-d3 w-full rounded-xl"
                />
                {/* `priced`, not `cards`: a pill reading "Offers ₱0" is worse
                    than one fewer institution in the rotation. */}
                <OfferPills cards={priced} />
              </div>
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

            <dl className="mt-12 grid divide-y divide-hairline border-y border-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
              {stats.map(([figure, label, body]) => (
                <div key={label} className="px-0 py-7 md:px-7 md:py-2 first:md:pl-0 last:md:pr-0">
                  <dt className="t-figure text-ink">{figure}</dt>
                  <dd>
                    <p className="t-body-strong mt-2 text-ink">{label}</p>
                    <p className="t-caption mt-2 max-w-[34ch] text-ink-mute text-pretty">{body}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>

        {/* ── The signature card ───────────────────────────────
            Three source cards put the kinds of organisations students can browse
            ahead of a single sample record, using provider crests as the visual. */}
        <Section tone="soft" labelledBy="sources-heading">
          <Container>
            <h2
              id="sources-heading"
              className="t-display-xl mx-auto max-w-[23ch] text-center text-balance uppercase"
            >
              Scholarships for Filipino students anywhere
            </h2>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {scholarshipSources.map((source) => {
                return (
                  <article key={source.label} className="flex min-h-[30rem] flex-col rounded-xl bg-canvas p-5 sm:p-6">
                    <div className="relative min-h-52 overflow-hidden rounded-lg bg-canvas-soft">
                      <Image
                        src={source.image}
                        alt={source.imageAlt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className={`object-cover ${source.imageClassName}`}
                      />
                      <p className="t-caption-strong absolute top-4 left-4 inline-flex w-fit rounded-full bg-canvas px-3 py-1 text-ink">
                        {source.label}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col">
                      <h3 className="t-display-md text-balance">{source.title}</h3>
                      <p className="t-body mt-3 text-ink-mute text-pretty">{source.body}</p>
                      <p className="t-caption mt-5 text-ink-mute">
                        {source.records.length} {source.records.length === 1 ? "record" : "records"} in the directory
                      </p>
                      <Link
                        href={ROUTES.scholarships}
                        className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-2 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                      >
                        Explore {source.label.toLowerCase()} scholarships
                        <ArrowRightIcon className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* ── Two-up, a figure in each ─────────────────────────
            Wise's "22 currencies" / "231 countries" pair. */}
        {false && <>
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
              title="You do not have to figure it all out alone."
              lead="A quieter way to move from uncertainty to an opportunity you can understand and act on."
            />

            <ul className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STUDENT_SUPPORT.map(({ title, body, href, cta, Icon }) => (
                <li
                  key={title}
                  className="flex flex-col border-t border-hairline pt-6 md:pt-8"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-brand-pale text-ink">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <h3 className="t-display-lg mt-6 text-ink">{title}</h3>
                  <p className="t-body mt-4 flex-1 text-ink-mute text-pretty">
                    {body}
                  </p>
                  <Link
                    href={href}
                    className="ring-brand t-caption-strong mt-6 inline-flex items-center gap-1.5 self-start rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                  >
                    {cta}
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
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
                    logo={card.logo}
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

        </>}

        <Section labelledBy="providers-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-16">
              <div className="lg:col-span-4 lg:pt-3">
                <h2 id="providers-heading" className="t-display-xl text-balance">
                  A small index. Real sources.
                </h2>
                <p className="t-body-lg mt-6 max-w-[38ch] text-ink-mute text-pretty">
                  {cards.length} opportunities across national agencies, LGUs,
                  universities and foundations.
                </p>
                <Link
                  href={ROUTES.scholarships}
                  className="ring-brand t-body-strong mt-8 inline-flex items-center gap-2 rounded-xs text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
                >
                  See all {cards.length} records
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <ul className="border-t border-hairline lg:col-span-8">
                {cards.slice(0, 6).map((card, index, list) => (
                  <li key={card.id}>
                    <RuledRow
                      last={index === list.length - 1}
                      className="gap-2 py-5 md:grid-cols-[minmax(0,1fr)_11rem] md:gap-8"
                    >
                      <Link href={ROUTES.scholarship(card.id)} className="group ring-brand rounded-xs">
                        <p className="t-body-strong text-ink group-hover:underline group-hover:decoration-hairline group-hover:underline-offset-4">
                          {card.provider}
                        </p>
                        <p className="t-caption mt-1 text-ink-mute text-pretty">{card.title}</p>
                      </Link>
                      <p className="t-caption text-ink-mute md:text-right">
                        Tier {card.sourceTier} source · checked{" "}
                        <time dateTime={card.lastVerified}>{formatIsoDate(card.lastVerified)}</time>
                      </p>
                    </RuledRow>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>

        <ClosingCta />
      </main>
    </>
  );
}
