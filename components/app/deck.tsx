"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScholarshipCard } from "@/components/scholarship/scholarship-card";
import { TapCardIndicator } from "@/components/app/tap-card-indicator";
import { Button, ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import { rankScholarships } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

/** A browsable set of deterministic matches, never a pass/save sorter. */
export function Deck({ detailOpen, onCardChange, onPositionChange }: { detailOpen: boolean; onCardChange?: (id: string) => void; onPositionChange?: (position: number, total: number) => void }) {
  const router = useRouter();
  const { state, dispatch, cards } = useTulAi();
  const reduced = usePrefersReducedMotion();
  const today = useToday();
  const [storedPosition, setPosition] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<1 | -1 | null>(null);
  const dragOrigin = useRef<number | null>(null);
  const dragDistance = useRef(0);
  const swipeTimer = useRef(0);
  const detailGesture = useRef<{ originY: number; opened: boolean } | null>(null);
  const ignoreDetailClick = useRef(false);
  const detailLiftRef = useRef(0);
  const [detailLift, setDetailLift] = useState(0);

  const deck = useMemo(
    () =>
      rankScholarships(cards, state.profile)
        .filter((result) => result.tone !== "none")
        .map((result) => ({
          card: cards.find((item) => item.id === result.id)!,
          result,
          rawIndex: cards.findIndex((item) => item.id === result.id),
        }))
        .filter(({ card }) => card.verification !== "Expired" && (!today || isDeadlineOpen(card.deadlineIso, today))),
    [cards, state.profile, today]
  );

  const position = Math.max(0, Math.min(storedPosition, Math.max(0, deck.length - 1)));

  useEffect(() => {
    dispatch({ type: "SET_FLIPPED", value: false });
  }, [dispatch, position]);

  const current = deck[position];
  const card = current?.card ?? null;
  const canGoBack = position > 0;
  const canGoForward = position < deck.length - 1;

  /* Keep whichever surface is listening in step with the deck: the desktop
     detail pane follows the initial top-ranked card as well as every swipe
     and arrow-key move, so it can never lag on the raw first record. */
  const currentId = card?.id ?? null;
  useEffect(() => {
    if (currentId) onCardChange?.(currentId);
  }, [currentId, onCardChange]);

  /* The page-level heading shows the deck's position, so report every change. */
  useEffect(() => {
    onPositionChange?.(position, deck.length);
  }, [onPositionChange, position, deck.length]);

  useEffect(() => () => window.clearTimeout(swipeTimer.current), []);

  const move = useCallback((direction: 1 | -1) => {
    if (exiting || (direction < 0 && !canGoBack) || (direction > 0 && !canGoForward)) return;
    setDragging(false);
    setExiting(direction);
    setDragX(direction * -720);
    swipeTimer.current = window.setTimeout(() => {
      const nextPosition = position + direction;
      setPosition(nextPosition);
      setDragX(0);
      setExiting(null);
    }, reduced ? 1 : 320);
  }, [canGoBack, canGoForward, exiting, position, reduced]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (exiting || (event.target as HTMLElement).closest("button, a")) return;
    dragOrigin.current = event.clientX;
    dragDistance.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOrigin.current === null) return;
    dragDistance.current = (event.clientX - dragOrigin.current) * 0.55;
    setDragX(dragDistance.current);
  };

  const onPointerUp = () => {
    if (dragOrigin.current === null) return;
    const x = dragDistance.current;
    dragOrigin.current = null;
    setDragging(false);
    if (x > 40) move(-1);
    else if (x < -40) move(1);
    else {
      setDragX(0);
      dispatch({ type: "TAP_CARD" });
    }
  };

  const openDetail = useCallback((expanded = false) => {
    if (card) router.push(expanded ? ROUTES.discoverCardExpanded(card.id) : ROUTES.discoverCard(card.id), { scroll: false });
  }, [card, router]);

  const startDetailGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    detailGesture.current = { originY: event.clientY, opened: false };
    detailLiftRef.current = 0;
    setDetailLift(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDetailGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = detailGesture.current;
    if (!gesture || gesture.opened) return;
    const distance = Math.max(0, gesture.originY - event.clientY);
    detailLiftRef.current = Math.min(distance, 88);
    setDetailLift(detailLiftRef.current);
    if (distance < 96) return;
    gesture.opened = true;
    ignoreDetailClick.current = true;
    setDetailLift(0);
    openDetail(true);
  };

  const endDetailGesture = () => {
    const gesture = detailGesture.current;
    if (!gesture) return;
    if (!gesture.opened && detailLiftRef.current < 6) {
      ignoreDetailClick.current = true;
      openDetail();
    }
    if (!gesture.opened) {
      detailLiftRef.current = 0;
      setDetailLift(0);
    }
    detailGesture.current = null;
  };

  useEffect(() => {
    if (detailOpen) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowLeft" && canGoBack) {
        event.preventDefault();
        setPosition((current) => current - 1);
      } else if (event.key === "ArrowRight" && canGoForward) {
        event.preventDefault();
        setPosition((current) => current + 1);
      } else if (event.key === " ") {
        event.preventDefault();
        dispatch({ type: "TAP_CARD" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canGoBack, canGoForward, detailOpen, dispatch]);

  return (
    <section className="relative mx-auto flex min-h-0 w-full max-w-[31rem] flex-1 flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:max-w-[25rem] lg:pb-5" aria-labelledby="deck-heading">
      <div className="relative min-h-[31rem] flex-1 lg:min-h-[33rem]">
        {card && current ? (
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className={cn("absolute inset-0 touch-pan-y origin-top will-change-transform [animation:rise_220ms_cubic-bezier(.2,.8,.3,1)_both]", dragging ? "transition-none" : "transition-[transform,opacity] duration-[320ms] ease-[cubic-bezier(.22,.85,.28,1)]")} style={{ transform: `translate3d(${dragX}px, ${exiting ? 28 : 0}px, 0) rotate(${reduced ? 0 : dragX / 28}deg)`, opacity: exiting ? 0 : 1 }} key={card.id}>
            <ScholarshipCard card={card} index={current.rawIndex} flipped={state.flipped} reduced={reduced} result={current.result} />
            {!state.hasTappedCard && <TapCardIndicator />}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <h2 className="t-display-lg text-balance">No open matched options yet.</h2>
            <p className="t-body mt-3 text-ink-mute">Add or correct profile details to clarify requirements that are still unknown.</p>
            <Button className="mt-7 h-12 px-6" onClick={() => router.push(ROUTES.profile)}>Update profile</Button>
          </div>
        )}
      </div>

      {card && (
        <div className="mt-6 grid flex-none grid-cols-2 items-center gap-3 lg:mt-4">
          <Button variant="tertiary" className="h-12 w-full justify-center gap-2 px-3" onClick={() => move(-1)} disabled={!canGoBack || Boolean(exiting)}><ArrowLeftIcon />Previous</Button>
          {canGoForward ? (
            <Button className="h-12 w-full justify-center gap-2 px-3" onClick={() => move(1)} disabled={Boolean(exiting)}>Next<ArrowRightIcon /></Button>
          ) : (
            <ButtonLink className="h-12 w-full justify-center px-4" href={ROUTES.review}>
              Browse all
            </ButtonLink>
          )}
          <button
            type="button"
            aria-label="Open scholarship details"
            onPointerDown={startDetailGesture}
            onPointerMove={moveDetailGesture}
            onPointerUp={endDetailGesture}
            onPointerCancel={endDetailGesture}
            onClick={() => {
              if (ignoreDetailClick.current) {
                ignoreDetailClick.current = false;
                return;
              }
              openDetail();
            }}
            className={cn("ring-brand col-span-full flex touch-none flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-hairline bg-canvas text-ink-mute transition-[height,background-color] duration-200 ease-out active:bg-canvas-soft lg:hidden", detailLift > 0 && "transition-none")}
            style={{ height: `${52 + detailLift}px` }}
          >
            <span className="h-1 w-10 rounded-full bg-ink/35" aria-hidden="true" />
            <span className="t-micro">Drag up or tap for details</span>
          </button>
        </div>
      )}
    </section>
  );
}
