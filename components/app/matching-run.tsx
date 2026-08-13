"use client";

import { ArrowRightIcon, CheckIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useTulAi } from "@/hooks/use-tul-ai";
import { formatPeso } from "@/lib/logic/format";
import {
  countsOf,
  rankScholarships,
  type MatchTone4,
  type RankedMatch,
} from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import { isProfileReady } from "@/lib/logic/validation";
import { SOURCE_LABELS, STAGE_LABELS, type Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const STAGE_MS = 760;

/**
 * The research moment (PRD §14). The animation makes the work visible, and the
 * results it hands over are computed — the deterministic eligibility engine
 * (`lib/logic/matching.ts`) ranked every programme against this profile. The
 * sequence never decides anything; it only waits for the arithmetic.
 */
export function MatchingRun() {
  const { state, dispatch, cards, ready } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState(0);
  const started = useRef(false);
  const timers = useRef<number[]>([]);

  const profileReady = isProfileReady(state.profile);

  /* Ranked once per profile+dataset, so the list, the counts and the deck can
     never disagree about which programme sits where. */
  const ranked = useMemo(() => rankScholarships(cards, state.profile), [cards, state.profile]);
  const counts = useMemo(() => countsOf(ranked), [ranked]);

  const relevant = ranked.filter((result) => result.tone !== "none");
  const top = relevant.slice(0, 3);
  const revealed = stage >= STAGE_LABELS.length;

  useEffect(() => {
    if (!ready || !profileReady || started.current) return;
    started.current = true;
    dispatch({ type: "RESET_DECK" });

    const gap = reduced ? 320 : STAGE_MS;
    STAGE_LABELS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStage(i + 1), (i + 1) * gap));
    });
  }, [dispatch, profileReady, ready, reduced]);

  // Safety fallback: if for any reason the staged timers don't run (hydration
  // or environment weirdness), reveal the results after a short delay so the
  // page is functional. This preserves the staged animation when it works.
  useEffect(() => {
    if (!ready || !profileReady) return;
    const fallback = window.setTimeout(() => setStage(STAGE_LABELS.length), 900);
    return () => window.clearTimeout(fallback);
  }, [ready, profileReady]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(window.clearTimeout);
  }, []);

  /* Someone landed here without answering the two questions that make matching
     possible at all — say so instead of animating over nothing. */
  if (ready && !profileReady) {
    return (
      <div className="mx-auto max-w-[34rem] py-20 text-center">
        <h1 className="t-display-lg text-balance">
          We need two answers before we can match you.
        </h1>
        <p className="t-body mt-4 text-ink-mute text-pretty">
          Where you study and what you study decide which programmes can apply to you at
          all. Everything after that is optional.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink className="h-12 rounded-md px-6" href={ROUTES.onboarding}>
            Answer two questions
          </ButtonLink>
          <ButtonLink
            variant="outline"
            className="h-12 rounded-md border-hairline-dark px-6"
            href={ROUTES.scholarships}
          >
            Just browse everything
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[34rem] py-16">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-7 flex-none place-items-center rounded-md bg-ink text-white"
          aria-hidden="true"
        >
          <SparklesIcon className="size-3.5" />
        </span>
        <p className="t-eyebrow text-ink-mute">Tul.AI is researching</p>
      </div>

      <h1 className="t-display-xl mt-5 text-balance">Finding scholarships for you…</h1>
      <p className="t-body mt-4 text-ink-mute text-pretty">
        We&apos;re comparing your answers against the published requirements of every
        verified programme.
      </p>

      <ol className="mt-10 flex flex-col gap-3.5" aria-live="polite">
        {STAGE_LABELS.map((label, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-5 flex-none items-center justify-center rounded-full transition-colors",
                  done ? "bg-met text-white" : "border-[1.5px] border-hairline",
                  current && "motion-safe:[animation:breathe_1.1s_ease-in-out_infinite]"
                )}
                aria-hidden="true"
              >
                {done && <CheckIcon className="size-3" strokeWidth={3} />}
              </span>
              <span className={cn("t-caption", done ? "text-ink" : "text-ink-mute")}>
                {label}
                {done && <span className="sr-only"> — done</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 rounded-lg border border-hairline bg-canvas-soft p-5 enter-card enter-d2">
        <p className="t-eyebrow text-ink-mute">Official sources</p>
        <ul className="mt-3.5 flex flex-col gap-2">
          {SOURCE_LABELS.map((label, i) => {
            const on = stage * 1.2 > i;
            return (
              <li key={label} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-4 flex-none items-center justify-center rounded-full transition-colors",
                    on ? "bg-met text-white" : "bg-hairline"
                  )}
                  aria-hidden="true"
                >
                  {on && <CheckIcon className="size-2.5" strokeWidth={3.5} />}
                </span>
                <span className={cn("t-caption", on ? "text-ink" : "text-ink-mute")}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
              <Count
                value={counts.reviewed}
                label="programmes reviewed"
                shown={stage >= 3}
                delayIndex={0}
              />
              <Count
                value={counts.relevant}
                label="potentially relevant"
                shown={stage >= 4}
                delayIndex={1}
              />
              <Count value={counts.strong} label="strong matches" shown={stage >= 5} delayIndex={2} />
            </div>
      </div>

      {/* ── Results: the ranked top matches, revealed when the research lands. ── */}
      {revealed && (
        <section
          aria-labelledby="top-matches-heading"
          className="mt-12 border-t border-hairline pt-10"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 flex-none place-items-center rounded-md bg-brand text-ink"
              aria-hidden="true"
            >
              <SparklesIcon className="size-3.5" />
            </span>
            <p className="t-eyebrow text-ink-mute">Ranked from your profile</p>
          </div>
          <h2 id="top-matches-heading" className="t-display-lg mt-5 text-balance">
            {top.length > 0 ? "Your top matches" : "No open match in this data set"}
          </h2>
          <p className="t-body mt-4 text-ink-mute text-pretty">
            {top.length > 0
              ? "Ranked by the published requirements you already meet, with the soonest deadlines first. Unknowns are never counted as failures."
              : "Nothing here resolves without a conflict on your current profile. Add what you know, or browse the full set — every programme is listed regardless."}
          </p>

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
                  delay={reduced ? undefined : `${120 + i * 120}ms`}
                />
              );
            })}
          </ol>

          <p className="t-micro mt-6 text-ink-mute">
            {relevant.length > top.length
              ? `${relevant.length - top.length} more ${
                  relevant.length - top.length === 1 ? "programme" : "programmes"
                } are worth a look — the full ranked list is on the deck.`
              : "This list is the full ranked set for your profile."}{" "}
            Meeting published requirements does not guarantee selection; each provider
            decides on its own.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink className="h-12 rounded-md px-6" href={ROUTES.discover}>
              Sort your full list
              <ArrowRightIcon />
            </ButtonLink>
            <ButtonLink
              variant="outline"
              className="h-12 rounded-md border-hairline-dark px-5"
              href={ROUTES.profile}
            >
              Edit your profile
            </ButtonLink>
          </div>
        </section>
      )}

      <p className="t-micro mt-6 text-ink-mute">
        Counts reflect the demo data set. Nothing here estimates your chance of being
        awarded a scholarship.
      </p>
    </div>
  );
}

/** A count in the research summary. Values sit behind the animation as dashes. */
function Count({
  value,
  label,
  shown,
  delayIndex,
}: {
  value: number;
  label: string;
  shown: boolean;
  delayIndex?: number;
}) {
  return (
    <div>
      <p
        className={cn("t-display-md t-num transition-colors", shown ? "text-ink" : "text-ink-mute")}
        style={
          delayIndex !== undefined && shown
            ? {
                animationName: "countUp",
                animationDuration: "420ms",
                animationTimingFunction: "ease-out",
                animationFillMode: "both",
                animationDelay: `${delayIndex * 140}ms`,
              }
            : undefined
        }
      >
        {shown ? value : "—"}
      </p>
      <p className="t-micro mt-1 text-ink-mute">{label}</p>
    </div>
  );
}

/** One ranked programme in the top list. The whole row opens the record. */
function TopMatch({
  card,
  index,
  result,
  rank,
  delay,
}: {
  card: Scholarship;
  index: number;
  result: RankedMatch;
  rank: number;
  delay?: string;
}) {
  const note =
    result.checks.find((check) => check.state !== "met")?.detail ?? result.checks[0]?.detail;

  return (
    <li
      className={cn(
        "rounded-lg border border-hairline bg-canvas transition-colors hover:border-hairline-dark/40",
        delay && "[animation:rise_420ms_cubic-bezier(.2,.8,.3,1)_both]"
      )}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <Link
        href={ROUTES.discoverCard(card.id)}
        className="ring-brand flex items-start gap-4 rounded-lg p-5 sm:p-6"
      >
        <span
          className="t-num mt-0.5 grid size-7 flex-none place-items-center rounded-full bg-ink text-white"
          aria-hidden="true"
        >
          {rank}
        </span>
        <ProviderCrest index={index} provider={card.provider} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-ink-mute">{card.provider}</p>
          <h3 className="t-display-md mt-0.5 text-balance">{card.title}</h3>

          {note && (
            <p className="t-caption mt-2 text-ink-mute text-pretty">
              <span className="sr-only">Why: </span>
              {note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ToneBadge tone={result.tone} />
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

/** The bucketed PRD §19 label — the only match "score" the UI ever shows. */
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
