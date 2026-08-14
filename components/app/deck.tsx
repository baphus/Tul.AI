"use client";

import { CheckIcon, SparklesIcon, Undo2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScholarshipCard } from "@/components/scholarship/scholarship-card";
import { TulAiChat } from "@/components/app/tul-ai-chat";
import { Button, ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import { rankScholarships } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import { savedCount } from "@/lib/logic/state";
import { cn } from "@/lib/utils";

/** Horizontal travel (px) that commits a swipe. */
const COMMIT_X = 46;
/** Movement below this is a tap, not a drag. */
const TAP_SLOP = 7;

interface DragState {
  active: boolean;
  x0: number;
  dx: number;
  moved: number;
}

const IDLE: DragState = { active: false, x0: 0, dx: 0, moved: 0 };

/**
 * A focused, one-decision-at-a-time discovery flow. Swipe remains a convenient
 * shortcut, while the labeled controls are the primary, discoverable path.
 */
export function Deck({ detailOpen }: { detailOpen: boolean }) {
  const router = useRouter();
  const { state, dispatch, cards } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const today = useToday();

  const deck = useMemo(
    () =>
      rankScholarships(cards, state.profile)
        .filter((result) => result.tone !== "none")
        .map((result) => ({
          card: cards.find((item) => item.id === result.id)!,
          result,
          rawIndex: cards.findIndex((item) => item.id === result.id),
        }))
        .filter(({ card }) =>
          card.verification !== "Expired" && (!today || isDeadlineOpen(card.deadlineIso, today))
        ),
    [cards, state.profile, today]
  );
  const current = deck[state.idx];
  const card = current?.card ?? null;
  const complete = state.idx >= deck.length;

  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);

  const drag = useRef<DragState>(IDLE);
  const wrap = useRef<HTMLDivElement>(null);
  const exitTimer = useRef(0);
  const undoTimer = useRef(0);

  const paint = useCallback(
    (dx: number, opacity: number) => {
      const element = wrap.current;
      if (!element) return;
      const rotation = reduced ? 0 : dx / 32;
      element.style.transform = `translate3d(${dx}px, 0, 0) rotate(${rotation}deg)`;
      element.style.opacity = String(opacity);
    },
    [reduced]
  );

  useEffect(() => {
    return () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(undoTimer.current);
    };
  }, []);

  const openDetail = useCallback(() => {
    if (!card) return;
    paint(0, 1);
    router.push(ROUTES.discoverCard(card.id), { scroll: false });
  }, [card, paint, router]);

  const showUndo = useCallback(() => {
    window.clearTimeout(undoTimer.current);
    setUndoVisible(true);
    undoTimer.current = window.setTimeout(() => setUndoVisible(false), 5000);
  }, []);

  const fling = useCallback(
    (direction: 1 | -1) => {
      if (!card || exiting) return;
      setUndoVisible(false);
      dispatch({ type: "FLING", dir: direction, index: current?.rawIndex });
      setExiting(true);
      paint(direction * 520, 0);
      exitTimer.current = window.setTimeout(
        () => {
          dispatch({ type: "COMMIT_FLING", index: current?.rawIndex });
          setExiting(false);
          paint(0, 1);
          if (direction === -1) showUndo();
        },
        reduced ? 160 : 260
      );
    },
    [card, current?.rawIndex, dispatch, exiting, paint, reduced, showUndo]
  );

  const undo = useCallback(() => {
    window.clearTimeout(undoTimer.current);
    setUndoVisible(false);
    dispatch({ type: "UNDO" });
  }, [dispatch]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (exiting || !card) return;
    drag.current = { ...IDLE, active: true, x0: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag.active) return;
    const dx = event.clientX - activeDrag.x0;
    activeDrag.dx = dx * 0.55;
    activeDrag.moved = Math.abs(dx);
    if (activeDrag.moved >= TAP_SLOP) paint(activeDrag.dx, 1);
  };

  const onPointerUp = () => {
    const activeDrag = drag.current;
    if (!activeDrag.active) return;
    drag.current = { ...activeDrag, active: false };
    setDragging(false);
    if (activeDrag.moved < TAP_SLOP) {
      paint(0, 1);
      dispatch({ type: "TAP_CARD" });
      return;
    }
    if (activeDrag.dx > COMMIT_X) return fling(1);
    if (activeDrag.dx < -COMMIT_X) return fling(-1);
    paint(0, 1);
  };

  /* Standard keyboard access stays available without becoming page chrome. */
  useEffect(() => {
    if (detailOpen) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (!card) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        fling(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        fling(1);
      } else if (event.key === " ") {
        event.preventDefault();
        dispatch({ type: "TAP_CARD" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, detailOpen, dispatch, fling]);

  const saved = savedCount(state);

  return (
    <section
      className="relative mx-auto flex w-full max-w-[31rem] flex-1 flex-col px-5 pt-7 pb-8 sm:px-6"
      aria-labelledby="deck-heading"
    >
      <div className="mb-6 flex flex-none items-end justify-between gap-4">
        <div>
          <h1 id="deck-heading" className="t-display-lg">
            Your scholarships
          </h1>
          <p className="t-caption mt-1 text-ink-mute">One opportunity at a time.</p>
        </div>
        <p className="t-caption t-num whitespace-nowrap text-ink-mute">
          {Math.min(state.idx + 1, deck.length)} of {deck.length}
        </p>
      </div>

      <div className="relative min-h-[31rem] flex-1">
        {card ? (
          <div
            ref={wrap}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="group"
            aria-roledescription="scholarship card"
            aria-label={`${card.provider} — ${card.title}`}
            className={cn(
              "absolute inset-0 cursor-grab touch-none will-change-transform active:cursor-grabbing",
              dragging
                ? "transition-none"
                : "transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(.32,.72,0,1)]"
            )}
          >
            <ScholarshipCard
              card={card}
              index={current.rawIndex}
              flipped={state.flipped}
              reduced={reduced}
              onFlip={() => dispatch({ type: "TAP_CARD" })}
              result={current.result}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-canvas text-ink">
              <CheckIcon className="size-5" />
            </span>
            <h2 className="t-display-lg mt-5 text-balance">You&apos;re all caught up.</h2>
            <p className="t-body mt-3 text-ink-mute">
              {saved === 1
                ? "You saved 1 opportunity to review."
                : `You saved ${saved} opportunities to review.`}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink className="h-12 px-6" href={ROUTES.review}>
                Review saved opportunities
              </ButtonLink>
              <Button variant="tertiary" className="h-12 px-5" onClick={() => dispatch({ type: "RESET_DECK" })}>
                Start again
              </Button>
            </div>
          </div>
        )}
      </div>

      {card && (
        <div className="mt-6 grid flex-none grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Button
            variant="tertiary"
            className="h-12 gap-2 px-4"
            onClick={() => fling(-1)}
            disabled={exiting}
          >
            <XIcon />
            Pass
          </Button>
          <Button
            variant="outline"
            className="h-12 px-4"
            onClick={openDetail}
            disabled={exiting}
          >
            Details
          </Button>
          <Button className="h-12 gap-2 px-4" onClick={() => fling(1)} disabled={exiting}>
            <CheckIcon />
            Save
          </Button>
        </div>
      )}

      {undoVisible && (
        <div
          role="status"
          className="absolute right-5 bottom-24 left-5 z-20 flex items-center justify-between gap-4 rounded-xl bg-ink px-5 py-3.5 text-white"
        >
          <p className="t-caption">Opportunity passed.</p>
          <Button variant="link" className="h-auto p-0 text-brand hover:text-brand-active" onClick={undo}>
            <Undo2Icon />
            Undo
          </Button>
        </div>
      )}

      {state.advice && (
        <div
          role="status"
          className="absolute right-5 bottom-24 left-5 z-20 flex gap-3 rounded-xl bg-ink p-4 text-white"
        >
          <span className="grid size-6 flex-none place-items-center rounded-full bg-brand text-ink" aria-hidden="true">
            <SparklesIcon className="size-3" />
          </span>
          <div className="flex-1">
            <p className="t-body-strong">{state.advice.title}</p>
            <p className="t-caption mt-1.5 text-on-dark-mute text-pretty">{state.advice.text}</p>
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

      <TulAiChat
        complete={complete}
        matches={deck.map(({ result }) => result)}
        matchedCards={deck.map(({ card: matchedCard }) => matchedCard)}
      />
    </section>
  );
}
