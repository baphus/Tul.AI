"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ScholarshipCard } from "@/components/scholarship/scholarship-card";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useTulAi } from "@/hooks/use-tul-ai";
import { clamp01 } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { isDeckDone, savedCount } from "@/lib/logic/state";
import { cn } from "@/lib/utils";

/** Horizontal travel (px) that commits a swipe. */
const COMMIT_X = 46;
/** Upward travel (px) that opens the detail view. */
const COMMIT_Y = 60;
/** Movement below this is a tap, not a drag. */
const TAP_SLOP = 7;

interface DragState {
  active: boolean;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  axis: "x" | "y" | null;
  moved: number;
}

const IDLE: DragState = { active: false, x0: 0, y0: 0, dx: 0, dy: 0, axis: null, moved: 0 };

/**
 * The swipe deck (PRD §20–22). Sorting is deliberately light, but nothing is
 * discarded and swiping is never the only way in: buttons, arrow keys and screen
 * readers drive the same actions, and reduced motion is respected.
 */
export function Deck({ detailOpen }: { detailOpen: boolean }) {
  const router = useRouter();
  const { state, dispatch, cards } = useTulAi();
  const reduced = usePrefersReducedMotion();

  const idx = state.idx;
  const done = isDeckDone(state);
  const card = done ? null : cards[idx];

  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);

  const drag = useRef<DragState>(IDLE);
  const wrap = useRef<HTMLDivElement>(null);
  const like = useRef<HTMLDivElement>(null);
  const pass = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  /* The gesture writes transforms straight to the DOM — a swipe never re-renders
     the tree, only its start, end and commit do. */
  const paint = useCallback(
    (dx: number, dy: number, opacity: number) => {
      const el = wrap.current;
      if (el) {
        const rot = reduced ? 0 : dx / 26;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg)`;
        el.style.opacity = String(opacity);
      }
      if (like.current) like.current.style.opacity = String(clamp01(dx / COMMIT_X));
      if (pass.current) pass.current.style.opacity = String(clamp01(-dx / COMMIT_X));
    },
    [reduced]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openDetail = useCallback(() => {
    if (!card) return;
    paint(0, 0, 1);
    router.push(ROUTES.discoverCard(card.id), { scroll: false });
  }, [card, paint, router]);

  const fling = useCallback(
    (dir: 1 | -1) => {
      if (!card || exiting) return;
      dispatch({ type: "FLING", dir });
      setExiting(true);
      paint(dir * 520, 40, 0);
      timer.current = window.setTimeout(
        () => {
          dispatch({ type: "COMMIT_FLING" });
          setExiting(false);
          paint(0, 0, 1);
        },
        reduced ? 160 : 300
      );
    },
    [card, dispatch, exiting, paint, reduced]
  );

  /* ── Pointer gesture ── */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exiting || !card) return;
    drag.current = { ...IDLE, active: true, x0: e.clientX, y0: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const rx = e.clientX - d.x0;
    const ry = e.clientY - d.y0;
    if (!d.axis && (Math.abs(rx) > 9 || Math.abs(ry) > 9)) {
      d.axis = ry < 0 && Math.abs(ry) > Math.abs(rx) * 1.6 ? "y" : "x";
    }
    d.moved = Math.max(Math.abs(rx), Math.abs(ry));
    if (d.axis === "y") {
      d.dy = Math.max(-110, ry);
      paint(0, d.dy, 1);
    } else if (d.axis === "x") {
      d.dx = rx * 0.55;
      paint(d.dx, 0, 1);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    drag.current = { ...d, active: false };
    setDragging(false);

    if (d.axis === "y" && d.dy < -COMMIT_Y) return openDetail();
    if (d.moved < TAP_SLOP) {
      paint(0, 0, 1);
      dispatch({ type: "TAP_CARD" });
      return;
    }
    if (d.dx > COMMIT_X) return fling(1);
    if (d.dx < -COMMIT_X) return fling(-1);
    paint(0, 0, 1);
  };

  /* ── Keyboard equivalents ── */
  useEffect(() => {
    if (detailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        return;
      }
      if (!card) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        fling(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        fling(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        openDetail();
      } else if (e.key === " ") {
        e.preventDefault();
        dispatch({ type: "TAP_CARD" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, detailOpen, dispatch, fling, openDetail]);

  const saved = savedCount(state);

  return (
    <section
      className="relative mx-auto flex w-full max-w-[27rem] flex-1 flex-col px-5 pt-6 pb-8 sm:px-6"
      aria-labelledby="deck-heading"
    >
      {/* ── Header ── */}
      <div className="mb-4 flex flex-none items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 id="deck-heading" className="t-display-lg">
            Your scholarships
          </h1>
          <p className="t-caption mt-1 text-ink-mute">
            {cards.length} programmes matched to your profile
          </p>
        </div>
        <div className="flex flex-none flex-col items-end gap-2">
          <p className="t-micro t-num whitespace-nowrap text-ink-mute">
            {Math.min(idx + 1, cards.length)} of {cards.length}
          </p>
          {state.history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-hairline"
              onClick={() => dispatch({ type: "UNDO" })}
            >
              <Undo2Icon />
              Undo
            </Button>
          )}
        </div>
      </div>

      {/* ── Card stack ── */}
      <div className="relative min-h-[30rem] flex-1">
        {card ? (
          <div className="absolute inset-0">
            <div
              className="absolute inset-x-3.5 -bottom-2 top-5 rounded-xl border border-hairline bg-canvas opacity-50"
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-[7px] -bottom-1 top-2.5 rounded-xl border border-hairline bg-canvas opacity-80"
              aria-hidden="true"
            />

            <div
              ref={wrap}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="group"
              aria-roledescription="swipeable scholarship card"
              aria-label={`${card.provider} — ${card.title}`}
              className={cn(
                "absolute inset-0 cursor-grab touch-none will-change-transform active:cursor-grabbing",
                dragging
                  ? "transition-none"
                  : "transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)]"
              )}
            >
              <ScholarshipCard
                card={card}
                index={idx}
                flipped={state.flipped}
                reduced={reduced}
                onFlip={() => dispatch({ type: "TAP_CARD" })}
              />
              <div
                ref={like}
                className="t-micro pointer-events-none absolute top-6 left-5 rounded-md border-2 border-met bg-canvas/90 px-3 py-1.5 text-met opacity-0"
                aria-hidden="true"
              >
                INTERESTED
              </div>
              <div
                ref={pass}
                className="t-micro pointer-events-none absolute top-6 right-5 rounded-md border-2 border-ink-mute bg-canvas/90 px-3 py-1.5 text-ink-mute opacity-0"
                aria-hidden="true"
              >
                PASS
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center [animation:rise_320ms_cubic-bezier(.2,.8,.3,1)_both]">
            <span className="grid size-12 place-items-center rounded-full border border-ink/25 text-ink">
              <CheckIcon className="size-5" />
            </span>
            <h2 className="t-display-lg mt-5 text-balance">That&apos;s everything for now.</h2>
            <p className="t-body mt-3 text-ink-mute">
              {saved === 1
                ? "You marked 1 opportunity as interesting."
                : `You marked ${saved} opportunities as interesting.`}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button className="h-12 rounded-md px-6" render={<Link href={ROUTES.review} />}>
                Review before applying
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-md border-hairline-dark px-5"
                onClick={() => dispatch({ type: "RESET_DECK" })}
              >
                Go through them again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      {card && (
        <>
          <p className="mt-5 flex flex-none items-center justify-center gap-2 text-center lg:hidden">
            <ChevronLeftIcon
              className={cn(
                "size-3.5 text-ink-mute",
                !dragging && "motion-safe:[animation:nudgeL_2.4s_ease-in-out_infinite]"
              )}
              aria-hidden="true"
            />
            <span className="t-micro text-ink-mute">
              Swipe to sort · swipe up for the full record
            </span>
            <ChevronRightIcon
              className={cn(
                "size-3.5 text-ink-mute",
                !dragging && "motion-safe:[animation:nudgeR_2.4s_ease-in-out_infinite]"
              )}
              aria-hidden="true"
            />
          </p>
          <p className="t-micro mt-5 hidden flex-none justify-center gap-3 text-ink-mute lg:flex">
            <span>← pass</span>
            <span>→ interested</span>
            <span>↑ details</span>
            <span>space flip</span>
            <span>⌘Z undo</span>
          </p>
        </>
      )}

      <div className="mt-5 flex flex-none items-center justify-center gap-6">
        <DeckAction
          label="Pass"
          hint="Pass — move this scholarship lower in your list"
          onClick={() => fling(-1)}
          disabled={!card || exiting}
          className="size-14 border border-hairline bg-canvas text-ink-mute hover:border-hairline-dark/40 hover:text-ink"
        >
          <XIcon className="size-5" />
        </DeckAction>
        <DeckAction
          label="Details"
          hint="Open the full scholarship record"
          onClick={openDetail}
          disabled={!card}
          className="size-12 border border-hairline bg-canvas text-ink hover:border-ink/40"
        >
          <ArrowUpIcon className="size-4" />
        </DeckAction>
        <DeckAction
          label="Interested"
          hint="Interested — keep this scholarship at the top of your list"
          onClick={() => fling(1)}
          disabled={!card || exiting}
          className="size-14 bg-ink text-white shadow-[0_8px_24px_rgba(14,15,12,0.28)] hover:bg-ink-deep"
        >
          <CheckIcon className="size-5" />
        </DeckAction>
      </div>

      {/* ── Cross-scholarship advice ── */}
      {state.advice && (
        <div
          role="status"
          className="absolute inset-x-5 bottom-28 z-20 flex gap-3 rounded-lg bg-ink p-4 text-white shadow-[0_16px_40px_rgba(14,15,12,0.35)] [animation:rise_320ms_cubic-bezier(.2,.8,.3,1)_both]"
        >
          <span
            className="grid size-6 flex-none place-items-center rounded-md bg-brand text-ink"
            aria-hidden="true"
          >
            <SparklesIcon className="size-3" />
          </span>
          <div className="flex-1">
            <p className="t-body-strong">{state.advice.title}</p>
            <p className="t-caption mt-1.5 text-on-dark-mute text-pretty">
              {state.advice.text}
            </p>
            <button
              type="button"
              className="ring-brand t-caption mt-3 rounded-xs text-brand underline underline-offset-4"
              onClick={() => dispatch({ type: "DISMISS_ADVICE" })}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function DeckAction({
  label,
  hint,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={hint}
        className={cn(
          "ring-brand grid place-items-center rounded-full transition-transform active:scale-90 disabled:pointer-events-none disabled:opacity-40",
          className
        )}
      >
        {children}
      </button>
      <span className="t-micro text-ink-mute">{label}</span>
    </div>
  );
}
