"use client";

import { ArrowRightIcon, SlidersHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { TulAiChat } from "@/components/app/tul-ai-chat";
import { AiMatchSummary } from "@/components/scholarship/ai-match-summary";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { ScholarshipSummaryCard } from "@/components/scholarship/scholarship-summary-card";
import { ButtonLink } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { isDeadlineOpen } from "@/lib/logic/deadlines";
import { rankScholarships, type RankedMatch } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import type { Scholarship } from "@/lib/scholarships";

type BrowseCard = { card: Scholarship; index: number; result: RankedMatch };

/**
 * The post-onboarding home for scholarships. Unlike the former priority list,
 * this always starts with live deterministic matches, so completing matching
 * produces a useful list before a student makes any save/pass choice.
 */
export function ReviewList({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const today = useToday();
  const { cards, state } = useTulAi();
  const [desktopCardId, setDesktopCardId] = useState<string | null>(null);
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
  const close = () => {
    setDesktopCardId(null);
    router.push(ROUTES.review, { scroll: false });
  };

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

  return (
    <div className="py-8 lg:py-10">
      <div className="flex flex-col gap-8 border-b border-hairline pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[44rem]">
          <h1 className="t-display-xl text-balance">Scholarships worth reviewing.</h1>
          <p className="t-body-lg mt-4 text-ink-mute text-pretty">
            These open opportunities have no known conflict with your profile. Select one to see the published requirements, ask a question, and continue only through the provider&apos;s official application.
          </p>
        </div>
        <p className="t-caption t-num flex-none text-ink-mute">
          {browseCards.length} open {browseCards.length === 1 ? "opportunity" : "opportunities"}
        </p>
      </div>

      <TulAiChat
        complete
        placement="dashboard"
        matches={browseCards.map(({ result }) => result)}
        matchedCards={browseCards.map(({ card }) => card)}
      />

      <div className="mt-8 lg:grid lg:min-h-[42rem] lg:grid-cols-[minmax(0,1fr)_minmax(23rem,34rem)] lg:gap-8">
        <section aria-label="Matched scholarships" className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {browseCards.map(({ card, index, result }) => (
              <ScholarshipSummaryCard
                key={card.id}
                card={card}
                index={index}
                result={result}
                href={ROUTES.reviewCard(card.id)}
                className="flex h-full flex-col"
                actions={
                  <button
                    type="button"
                    onClick={() => open(card.id)}
                    aria-controls="scholarship-review-detail"
                    className="ring-brand t-caption-strong flex w-full items-center justify-between rounded-md border border-hairline px-4 py-2.5 text-ink transition-colors hover:bg-canvas-soft"
                  >
                    Review this scholarship <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </button>
                }
              />
            ))}
          </div>
        </section>

        <aside
          id="scholarship-review-detail"
          aria-label="Selected scholarship details"
          className="hidden min-h-0 overflow-hidden rounded-xl border border-hairline bg-canvas lg:block"
        >
          {selectedDetail ? (
            <div ref={detailPane} className="sc max-h-[calc(100dvh-11rem)] overflow-y-auto overscroll-contain">
              {selectedDetail}
            </div>
          ) : (
            <div className="flex h-full min-h-[30rem] flex-col justify-end bg-canvas-soft p-7">
              <p className="t-display-lg max-w-[12ch] text-balance">Choose a scholarship to review.</p>
              <p className="t-caption mt-3 max-w-[34ch] text-ink-mute text-pretty">
                Its published details and its own grounded Q&amp;A will appear here without taking you away from the list.
              </p>
            </div>
          )}
        </aside>
      </div>

      <Sheet open={Boolean(selected) && !desktop} onOpenChange={(next) => !next && close()}>
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

      <p className="t-micro mt-8 text-ink-mute">
        A matching result explains the published requirements; it does not guarantee selection. The provider makes every application and award decision.
      </p>
    </div>
  );
}
