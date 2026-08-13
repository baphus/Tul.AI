"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useTulAi } from "@/hooks/use-tul-ai";
import { ROUTES } from "@/lib/logic/routes";
import { isProfileReady } from "@/lib/logic/validation";
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const STAGE_MS = 760;
const HANDOFF_MS = 700;

const COUNTS: [string, string][] = [
  ["42", "opportunities reviewed"],
  ["11", "potentially relevant"],
  ["6", "strong matches"],
];

/**
 * The research moment (PRD §14). It exists to make the work visible and to set
 * expectations — the deck it hands off to was produced by the eligibility engine,
 * not by the animation.
 */
export function MatchingRun() {
  const router = useRouter();
  const { state, dispatch, ready } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState(0);
  const started = useRef(false);
  const timers = useRef<number[]>([]);

  const profileReady = isProfileReady(state.profile);

  useEffect(() => {
    if (!ready || !profileReady || started.current) return;
    started.current = true;
    dispatch({ type: "RESET_DECK" });

    const gap = reduced ? 320 : STAGE_MS;
    STAGE_LABELS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStage(i + 1), (i + 1) * gap));
    });
    timers.current.push(
      window.setTimeout(
        () => router.replace(ROUTES.discover),
        STAGE_LABELS.length * gap + (reduced ? 260 : HANDOFF_MS)
      )
    );
  }, [dispatch, profileReady, ready, reduced, router]);

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
          <Button className="h-12 rounded-md px-6" render={<Link href={ROUTES.onboarding} />}>
            Answer two questions
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-md border-hairline-dark px-6"
            render={<Link href={ROUTES.scholarships} />}
          >
            Just browse everything
          </Button>
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

      <div className="mt-10 rounded-lg border border-hairline bg-canvas-soft p-5">
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
          {COUNTS.map(([value, label], i) => {
            const shown = stage >= i + 3;
            return (
              <div key={label}>
                <p
                  className={cn(
                    "t-display-md t-num transition-colors",
                    shown ? "text-ink" : "text-ink-mute"
                  )}
                >
                  {shown ? value : "—"}
                </p>
                <p className="t-micro mt-1 text-ink-mute">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="t-micro mt-6 text-ink-mute">
        Counts reflect the demo data set. Nothing here estimates your chance of being
        awarded a scholarship.
      </p>
    </div>
  );
}
