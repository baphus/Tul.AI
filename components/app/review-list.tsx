"use client";

import { ArrowRightIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TulAiChat } from "@/components/app/tul-ai-chat";
import { AiMatchSummary } from "@/components/scholarship/ai-match-summary";
import { ScholarshipCard } from "@/components/scholarship/scholarship-card";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import { rankScholarships, type RankedMatch } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import type { Scholarship } from "@/lib/scholarships";

type BrowseCard = { card: Scholarship; index: number; result: RankedMatch };

/**
 * The post-onboarding home for scholarships. The grid deliberately uses the
 * Discover deck's front face, so the same opportunity has one recognisable
 * visual language whether it is browsed singly or alongside its peers.
 */
export function ReviewList({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const today = useToday();
  const { cards, state } = useTulAi();
  const [desktopCardId, setDesktopCardId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const detailPane = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () => rankScholarships(cards, state.profile).filter((result) => result.tone !== "none"),
    [cards, state.profile]
  );
  const browseCards = useMemo<BrowseCard[]>(
    () =>
      matches
        .map((result) => {
          const index = cards.findIndex((card) => card.id === result.id);
          return { card: cards[index], index, result };
        })
        .filter(
          (item): item is BrowseCard =>
            Boolean(item.card) &&
            item.card.verification !== "Expired" &&
            (!today || isDeadlineOpen(item.card.deadlineIso, today))
        ),
    [cards, matches, today]
  );

  const activeCardId = desktop ? desktopCardId ?? cardId : cardId;
  const selected = activeCardId
    ? browseCards.find(({ card }) => card.id === activeCardId) ?? null
    : null;

  useEffect(() => {
    detailPane.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selected?.card.id]);

  const open = (id: string) => {
    if (desktop) setDesktopCardId(id);
    router.push(ROUTES.reviewCard(id), { scroll: false });
  };
  const close = useCallback(() => {
    setDesktopCardId(null);
    router.push(ROUTES.review, { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, selected]);

  if (browseCards.length === 0) {
    return (
      <div className="mx-auto max-w-[42rem] py-18 text-center">
        <h1 className="t-display-xl text-balance">No open matches right now.</h1>
        <p className="t-body-lg mx-auto mt-4 max-w-[40ch] text-ink-mute text-pretty">
          Your profile was checked, but the currently open verified records do not show a match yet. A closed deadline is never presented as an active opportunity.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink className="h-12 px-6" href={ROUTES.profile}>
            Update profile <SlidersHorizontalIcon />
          </ButtonLink>
          <ButtonLink variant="outline" className="h-12 border-hairline-dark px-6" href={ROUTES.scholarships}>
            Browse verified records <ArrowRightIcon />
          </ButtonLink>
        </div>
      </div>
    );
  }

  const selectedDetail = selected && (
    <ScholarshipDetail
      card={selected.card}
      index={selected.index}
      result={selected.result}
      matchExplanation={<AiMatchSummary result={selected.result} />}
    />
  );
  const gridClass = "grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5";

  return (
    <div className="py-5 lg:py-7">
      <header className="mb-6">
        <h1 className="t-display-lg">Scholarships for you</h1>
        <p className="t-body mt-2 text-ink-mute">Click a card to view its details and ask about it.</p>
      </header>

      <TulAiChat
        complete={!selected}
        placement="floating"
        matches={browseCards.map(({ result }) => result)}
        matchedCards={browseCards.map(({ card }) => card)}
      />

      <section aria-label="Matched scholarships" className="min-w-0">
        <div className={gridClass}>
          {browseCards.map(({ card, index, result }) => (
            <div
              key={card.id}
              className="relative min-h-[12rem] overflow-hidden rounded-xl sm:min-h-[14rem] lg:min-h-[15rem]"
            >
              <ScholarshipCard card={card} index={index} flipped={false} reduced={reduced} result={result} compact />
              <button
                type="button"
                onClick={() => open(card.id)}
                className="ring-brand absolute inset-0 z-10 rounded-xl"
                aria-controls="scholarship-review-detail"
                aria-label={`Review ${card.title}`}
              >
                <span className="sr-only">Review {card.title}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <button
          type="button"
          aria-label="Close scholarship details"
          onClick={close}
          className="fixed inset-0 z-30 hidden bg-ink/10 backdrop-blur-[2px] lg:block"
        />
      )}

      <aside
        id="scholarship-review-detail"
        aria-label="Selected scholarship details"
        aria-hidden={!selected}
        className={`fixed top-0 right-0 bottom-0 z-40 hidden w-[min(42rem,46vw)] overflow-hidden border-l border-hairline bg-canvas transition-transform duration-[360ms] ease-[cubic-bezier(.16,1,.3,1)] lg:block ${selected ? "translate-x-0" : "translate-x-full"}`}
      >
        {selected && (
          <>
            <div className="absolute top-3 right-3 z-10">
              <Button variant="tertiary" size="icon" aria-label="Close scholarship details" onClick={close}>
                <XIcon />
              </Button>
            </div>
            <div ref={detailPane} className="sc h-full overflow-y-auto overscroll-contain">
              {selectedDetail}
            </div>
          </>
        )}
      </aside>

      <Sheet open={Boolean(selected) && !desktop && !guideOpen} onOpenChange={(next) => !next && close()}>
        {selected && (
          <SheetContent
            side="bottom"
            className="max-h-[92dvh] gap-0 overflow-hidden rounded-t-xl bg-canvas p-0 pb-[env(safe-area-inset-bottom)] text-ink shadow-[0_-16px_45px_-28px_rgba(14,15,12,0.45)]"
          >
            <SheetTitle className="sr-only">{selected.card.title}</SheetTitle>
            <SheetDescription className="sr-only">Published scholarship details and grounded questions.</SheetDescription>
            <div className="sc min-h-0 flex-1 overflow-y-auto overscroll-contain">{selectedDetail}</div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent
          side="center"
          showCloseButton={false}
          className="h-auto max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] gap-0 overflow-y-auto rounded-xl border border-ink bg-canvas p-4 text-ink sm:p-5"
        >
          <SheetTitle className="t-heading">Your review deck is ready.</SheetTitle>
          <SheetDescription className="t-caption mt-2.5 text-ink-mute text-pretty">
            Open any card for the full published record. You can ask Tul.AI about a scholarship there, or use the chat button whenever you want help comparing your options.
          </SheetDescription>
          <Button className="mt-4 h-11 w-full px-5" onClick={() => setGuideOpen(false)}>
            Start reviewing <ArrowRightIcon />
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
