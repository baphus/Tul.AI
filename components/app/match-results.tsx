"use client";

import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { NeedsAnswers } from "@/components/app/matching-run";
import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { DotGrid } from "@/components/site/dot-grid";
import { ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { formatPeso } from "@/lib/logic/format";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import { countsOf, rankScholarships, type MatchTone4, type RankedMatch } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import { isProfileReady } from "@/lib/logic/validation";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * Where the research lands (spec §3.4): the ranked list, on its own screen.
 *
 * Lifted off `/matching` so the research moment can be a research moment and this
 * can be a result the student actually reads, rather than both competing for one
 * scroll. Its primary action is the deck, which is where sorting happens.
 *
 * Ranking is `rankScholarships` — the same call the deck and the research passes
 * make — so no two surfaces can disagree about which programme sits where.
 */
export function MatchResults() {
  const { state, cards, ready } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const today = useToday();

  const profileReady = isProfileReady(state.profile);

  const ranked = useMemo(
    () => rankScholarships(cards, state.profile).filter((result) => {
      const card = cards.find((item) => item.id === result.id);
      return Boolean(card && card.verification !== "Expired" && (!today || isDeadlineOpen(card.deadlineIso, today)));
    }),
    [cards, state.profile, today]
  );
  const counts = useMemo(() => countsOf(ranked), [ranked]);

  const relevant = useMemo(() => ranked.filter((r) => r.tone !== "none"), [ranked]);
  const notCurrentlyEligible = useMemo(() => ranked.filter((r) => r.tone === "none"), [ranked]);
  const top = relevant.slice(0, 5);

  /* Advisory only (AGENTS.md §7): the explanation is prose about a result the
     deterministic engine already decided. It reorders nothing and it overrides
     no state. */
  if (ready && !profileReady) return <NeedsAnswers profile={state.profile} />;

  return (
    <div className="mx-auto max-w-[46rem] py-14">
      {/* ── The result, on the hero's band ── */}
      <div className="relative overflow-hidden rounded-xl bg-brand px-6 py-8 sm:px-8">
        <DotGrid baseColor="#86d95a" activeColor="#163300" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 flex-none place-items-center rounded-md bg-ink-deep text-white"
              aria-hidden="true"
            >
              <SparklesIcon className="size-3.5" />
            </span>
            <p className="t-eyebrow text-ink-deep/70">Ranked from your profile</p>
          </div>

          <h1 className="t-display-xl enter mt-5 text-balance text-ink-deep">
            {top.length > 0 ? "Your top matches" : "No open match in this data set"}
          </h1>
          <p className="t-body enter enter-d1 mt-4 max-w-[42ch] text-ink-deep/80 text-pretty">
            {top.length > 0
              ? "Ranked by confirmed published requirements, then fewer unknowns, verification and source reliability, deadline, and published benefit. Unknowns are never counted as failures."
              : "Nothing here resolves without a conflict on your current profile. Add what you know, or browse the full set — every programme is listed regardless."}
          </p>

          <dl className="enter enter-d2 mt-7 flex flex-wrap gap-x-8 gap-y-3">
            <Stat value={counts.reviewed} label="reviewed" />
            <Stat value={counts.relevant} label="no conflict" />
            <Stat value={counts.strong} label="every requirement met" />
          </dl>
        </div>
      </div>

      <ol className="mt-8 flex flex-col gap-3.5" aria-label="Ranked scholarship matches">
        {top.map((result, i) => {
          const index = cards.findIndex((card) => card.id === result.id);
          const card = cards[index];
          if (!card) return null;
          return (
            <TopMatch
              key={result.id}
              card={card}
              index={index}
              result={result}
              rank={i + 1}
              delay={reduced ? undefined : `${80 + i * 90}ms`}
            />
          );
        })}
      </ol>

      <p className="t-micro mt-6 max-w-[70ch] text-ink-mute text-pretty">
        {relevant.length > top.length
          ? `${relevant.length - top.length} more ${
              relevant.length - top.length === 1 ? "programme" : "programmes"
            } are worth a look — the full ranked list is on the deck.`
          : "This list is the full ranked set for your profile."}{" "}
        Percentages count the published requirements you meet; they are not a prediction.
        Meeting every requirement does not guarantee selection — each provider decides on
        its own.
      </p>

      {notCurrentlyEligible.length > 0 && (
        <section className="mt-10 border-t border-hairline pt-8" aria-labelledby="not-a-fit">
          <h2 id="not-a-fit" className="t-display-lg">Not a fit right now</h2>
          <p className="t-body mt-2 text-ink-mute text-pretty">These options have a known conflict with your current profile. They stay separate from matched options, and their details show the published requirement behind that result.</p>
          <ul className="mt-5 flex flex-col gap-2">
            {notCurrentlyEligible.map((result) => {
              const card = cards.find((item) => item.id === result.id);
              const reason = result.checks.find((check) => check.state === "not-met")?.detail;
              return card ? <li key={result.id}><Link href={ROUTES.discoverCard(card.id)} className="ring-brand flex rounded-lg border border-hairline bg-canvas p-4 transition-colors hover:bg-canvas-soft"><span className="min-w-0 flex-1"><span className="t-body-strong block">{card.title}</span><span className="t-caption mt-1 block text-ink-mute">{reason}</span></span><ArrowRightIcon className="mt-1 size-4 flex-none text-ink-mute" /></Link></li> : null;
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink className="h-12 rounded-md px-6" href={ROUTES.review}>
          View matched options
          <ArrowRightIcon />
        </ButtonLink>
        <ButtonLink
          variant="tertiary"
          className="h-12 rounded-md px-5"
          href={ROUTES.profile}
        >
          Edit your profile
        </ButtonLink>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="t-display-md t-num block text-ink-deep">{value}</span>
        <span className="t-micro block text-ink-deep/70">{label}</span>
      </dd>
    </div>
  );
}

/** One ranked programme. The whole row opens the record. */
function TopMatch({
  card,
  index,
  result,
  rank,
  aiExplanation,
  delay,
}: {
  card: Scholarship;
  index: number;
  result: RankedMatch;
  rank: number;
  aiExplanation?: string;
  delay?: string;
}) {
  const note =
    result.checks.find((check) => check.state !== "met")?.detail ?? result.checks[0]?.detail;

  return (
    <li
      className={cn(
        "rounded-xl border border-hairline bg-canvas transition-colors hover:border-hairline-dark/40",
        delay && "[animation:rise_420ms_cubic-bezier(.2,.8,.3,1)_both]"
      )}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <Link
        href={ROUTES.discoverCard(card.id)}
        className="ring-brand flex items-start gap-4 rounded-xl p-5 sm:p-6"
      >
        <span
          className="t-num mt-0.5 grid size-7 flex-none place-items-center rounded-full bg-ink text-white"
          aria-hidden="true"
        >
          {rank}
        </span>
        <ProviderCrest
          index={index}
          provider={card.provider}
          logo={card.logo}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-ink-mute">{card.provider}</p>
          <h3 className="t-display-md mt-0.5 text-balance">{card.title}</h3>

          {aiExplanation ? (
            <p className="t-caption mt-2 flex items-start gap-1.5 text-ink text-pretty">
              <SparklesIcon className="mt-0.5 size-3.5 flex-none text-brand" />
              <span>{aiExplanation}</span>
            </p>
          ) : note ? (
            <p className="t-caption mt-2 text-ink-mute text-pretty">
              <span className="sr-only">Why: </span>
              {note}
            </p>
          ) : null}

          <RequirementScore result={result} className="mt-3" />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {result.tone !== "possible" && <ToneBadge tone={result.tone} />}
            <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} />
          </div>
        </div>

        <div className="flex-none text-right">
          <p className="t-display-md t-num">{formatPeso(card.amount)}</p>
          <p className="t-micro mt-0.5 text-ink-mute">{card.amountNote}</p>
        </div>
      </Link>
    </li>
  );
}

/**
 * The auditable score (spec §2.1): a segment per published requirement, the count
 * spelled out, and the percentage that count works out to.
 *
 * `percent === null` means the provider published nothing this engine can check.
 * That is stated rather than rendered as 0%, because a programme with no criteria
 * has not been failed — it has not been measured. Colour is never the only signal;
 * the count and the percentage are both in text.
 */
function RequirementScore({
  result,
  className,
}: {
  result: RankedMatch;
  className?: string;
}) {
  if (result.percent === null) {
    return (
      <p className={cn("t-micro text-ink-mute text-pretty", className)}>
        This provider publishes no requirements we can check automatically.
      </p>
    );
  }

  const fill = result.tone === "strong" ? "bg-met" : result.tone === "none" ? "bg-negative" : "bg-attention";

  return (
    <div className={className}>
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${result.match}. ${result.met} of ${result.total} published requirements met, ${result.percent} percent${result.unknown > 0 ? `, ${result.unknown} unknown` : ""}.`}
      >
        {Array.from({ length: result.total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < result.met ? fill : "bg-hairline"
            )}
          />
        ))}
      </div>
      <p className="t-micro t-num mt-1.5 text-ink-mute" aria-hidden="true">
        {result.met} of {result.total} requirements met · {result.percent}%
        {result.unknown > 0 && ` · ${result.unknown} unknown`}
      </p>
    </div>
  );
}

const TONE_CHROME: Record<MatchTone4, string> = {
  strong: "border-met/25 bg-met/8 text-met",
  good: "border-attention/25 bg-attention/8 text-attention-ink",
  possible: "border-hairline-dark/25 bg-canvas-soft text-ink-mute",
  none: "border-negative/25 bg-negative/8 text-negative-deep",
};

const TONE_DOT: Record<MatchTone4, string> = {
  strong: "bg-met",
  good: "bg-attention",
  possible: "bg-ink-mute",
  none: "bg-negative",
};

/** The bucketed PRD §19 label — still the primary reading of a match. */
function ToneBadge({ tone }: { tone: MatchTone4 }) {
  return (
    <span
      className={cn(
        "t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        TONE_CHROME[tone]
      )}
    >
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden="true" />
      {tone === "strong"
        ? "Strong match"
        : tone === "good"
          ? "Good match"
          : tone === "possible"
            ? "Possible match"
            : "Not currently eligible"}
    </span>
  );
}
