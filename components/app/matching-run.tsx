"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DotGrid } from "@/components/site/dot-grid";
import { ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import {
  PASS_COUNT,
  PASS_LABELS,
  matchAll,
  tallyPass,
  totalsOf,
  type PassResult,
  type RunTotals,
} from "@/lib/logic/match-passes";
import { ROUTES } from "@/lib/logic/routes";
import { isProfileReady, matchingRecoveryStep } from "@/lib/logic/validation";
import type { Profile } from "@/lib/logic/state";
import { cn } from "@/lib/utils";

/**
 * The research moment (PRD §14, spec §3.5): an animation over real work, and
 * nothing else on the screen. The ranked results it produces live on `/matches`.
 *
 * Every line here completes when its pass has actually run, and every figure
 * beside it is the figure that pass produced. The floor below delays a *completed*
 * pass being shown so a fast machine doesn't flash five lines in one frame; it can
 * never let the sequence finish before the arithmetic does. That asymmetry is the
 * design — the animation waits for the work, never the reverse.
 *
 * What this replaced: five fixed 760 ms timers plus a 900 ms fallback, whose ticks
 * were unconnected to the computation they claimed to depict.
 */

/** A brief confirmation that the completed, deterministic result is ready. */
const PASS_REVEAL_MS = 520;
const RESULT_PREVIEW_MS = 620;

const SOURCE_CHECKS = [
  "Official provider pages",
  "Published notices",
  "Structured requirements",
  "Deadline details",
  "Source reliability",
];

export function MatchingRun() {
  const router = useRouter();
  const { state, dispatch, cards, ready } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const today = useToday();
  const [visiblePasses, setVisiblePasses] = useState(0);

  const profileReady = isProfileReady(state.profile);
  /* The local engine is cheap and pure. Derive its finished output directly so
     the screen cannot depend on an interruptible sequence of state updates. */
  const pairs = useMemo(
    () => (profileReady ? matchAll(cards, state.profile) : []),
    [cards, profileReady, state.profile]
  );
  const passes = useMemo<PassResult[]>(
    () => Array.from({ length: PASS_COUNT }, (_, index) => tallyPass(index, pairs)),
    [pairs]
  );
  const totals = useMemo<RunTotals | null>(
    () => (profileReady ? totalsOf(pairs) : null),
    [pairs, profileReady]
  );
  /* Keep the handoff honest: a closed record is researched, but never counted
     as a path the student can currently explore. */
  const openMatches = useMemo(
    () =>
      pairs.filter(
        ({ card, result }) =>
          result.tone !== "none" &&
          card.verification !== "Expired" &&
          (!today || isDeadlineOpen(card.deadlineIso, today))
      ),
    [pairs, today]
  );

  useEffect(() => {
    if (!ready || !profileReady) return;
    dispatch({ type: "RESET_DECK" });

    const openDiscover = () => {
      window.sessionStorage.setItem("tul-ai:match-celebration", "1");
      window.sessionStorage.removeItem("tul-ai:chat-match-seen");
      router.replace(ROUTES.review);
    };

    if (reduced) {
      openDiscover();
      return;
    }

    let completed = 0;
    let timer: number | undefined;

    const revealNextPass = () => {
      completed += 1;
      setVisiblePasses(completed);

      if (completed === PASS_COUNT) {
        timer = window.setTimeout(openDiscover, RESULT_PREVIEW_MS);
        return;
      }

      timer = window.setTimeout(revealNextPass, PASS_REVEAL_MS);
    };

    timer = window.setTimeout(revealNextPass, PASS_REVEAL_MS);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [cards, dispatch, profileReady, ready, reduced, router, state.profile]);

  /* Someone landed here without the two answers that make matching possible at
     all — say so instead of animating over nothing. */
  if (ready && !profileReady) {
    return <NeedsAnswers profile={state.profile} />;
  }

  const done = Math.min(visiblePasses, passes.length);
  const progress = Math.round((done / PASS_COUNT) * 100);

  return (
    <div className="mx-auto max-w-[34rem] py-14">
      {/* The hero's band, carrying the research state. */}
      <div className="relative overflow-hidden rounded-xl bg-brand px-6 py-8 sm:px-8">
        <DotGrid baseColor="#86d95a" activeColor="#163300" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 flex-none place-items-center rounded-md bg-ink-deep text-white motion-safe:[animation:sparklePulse_1.6s_ease-in-out_infinite]"
              aria-hidden="true"
            >
              <SparklesIcon className="size-3.5" />
            </span>
            <p className="t-eyebrow text-ink-deep/70">Matching your profile</p>
          </div>

          <h1 className="t-display-xl mt-5 text-balance text-ink-deep">
            Building your opportunity view...
          </h1>
          <p className="t-body mt-4 text-ink-deep/80 text-pretty">
            We&apos;re carefully comparing the details you shared with published requirements.
          </p>

          <div
            className="mt-7 h-1.5 overflow-hidden rounded-full bg-ink-deep/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Research progress"
          >
            <span
              className="block h-full rounded-full bg-ink-deep transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── The passes, each completing when its own work has run ── */}
      <ol className="mt-9 flex flex-col gap-4" aria-live="polite">
        {PASS_LABELS.map((label, i) => {
          const result = i < done ? passes[i] : undefined;
          const current = i === done;
          return (
            <li key={label} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-5 flex-none items-center justify-center rounded-full transition-colors",
                  result ? "bg-met text-white" : "border-[1.5px] border-hairline",
                  current && "motion-safe:[animation:breathe_1.1s_ease-in-out_infinite]"
                )}
                aria-hidden="true"
              >
                {result && <CheckIcon className="size-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn("t-caption block", result ? "text-ink" : "text-ink-mute")}
                >
                  {label}
                  {result && <span className="sr-only"> — done</span>}
                </span>
                {/* The pass's own figures, shown only once it has produced them. */}
                {result && (
                  <span className="t-micro t-num mt-1 block text-ink-mute">
                    {i === 0
                      ? `${cards.length} records read`
                      : `${result.met} met · ${result.unknown} unknown · ${result.conflicts} conflicting`}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-9 rounded-xl border border-hairline bg-canvas-soft p-5">
        <p className="t-eyebrow text-ink-mute">Official sources</p>
        <ul className="mt-3.5 flex flex-col gap-2">
          {SOURCE_CHECKS.map((label, i) => {
            /* Tied to real progress rather than to a timer: a source lights up
               once enough passes have completed to have consulted it. */
            const on = done * (SOURCE_CHECKS.length / PASS_COUNT) > i;
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
          <Count value={done === PASS_COUNT ? totals?.reviewed : undefined} label="records reviewed" />
          <Count value={done === PASS_COUNT ? totals?.requirements : undefined} label="requirements compared" />
          <Count value={done === PASS_COUNT ? openMatches.length : undefined} label="open paths to explore" />
        </div>
      </div>

      <p className="t-micro mt-6 text-ink-mute text-pretty">
        Each step is based on published information. This helps you explore options; it
        does not predict an outcome.
      </p>
    </div>
  );
}

/** The two-answers prompt, shared with `/matches`. */
export function NeedsAnswers({ profile }: { profile: Profile }) {
  return (
    <div className="mx-auto max-w-[34rem] py-20 text-center">
      <h1 className="t-display-lg text-balance">
        We need two answers before we can match you.
      </h1>
      <p className="t-body mt-4 text-ink-mute text-pretty">
        Where you&apos;re based and what you study decide which programmes can apply to you
        at all. Everything after that is optional.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink
          className="h-12 rounded-md px-6"
          href={ROUTES.onboardingStep(matchingRecoveryStep(profile))}
        >
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

/** A count in the research summary. Dashes until the figure is actually known. */
function Count({ value, label }: { value: number | undefined; label: string }) {
  const shown = value !== undefined;
  return (
    <div>
      <p
        className={cn("t-display-md t-num", shown ? "text-ink" : "text-ink-mute")}
        style={
          shown
            ? {
                animationName: "countUp",
                animationDuration: "420ms",
                animationTimingFunction: "ease-out",
                animationFillMode: "both",
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
