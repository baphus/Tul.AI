"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Deck } from "@/components/app/deck";
import { MatchCelebration } from "@/components/app/match-celebration";
import { AiMatchSummary } from "@/components/scholarship/ai-match-summary";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTulAi } from "@/hooks/use-tul-ai";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useTranslation } from "@/lib/logic/language";
import { matchScholarship } from "@/lib/logic/matching";
import { cardForId, ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

/**
 * Discover keeps one opportunity in focus. Details rise beside it on desktop
 * and from the bottom on phones, so closing the record returns to the same
 * decision without reorienting the student.
 */
export function DiscoverScreen({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cards, state } = useTulAi();
  const { t } = useTranslation();
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const [desktopCardId, setDesktopCardId] = useState<string | null>(null);
  const [deckPosition, setDeckPosition] = useState(0);
  const [deckTotal, setDeckTotal] = useState(0);
  const [sheetSizing, setSheetSizing] = useState<{ cardId: string | null; height: number | null }>({ cardId: null, height: null });
  const [draggingSheet, setDraggingSheet] = useState(false);
  const detailPane = useRef<HTMLDivElement>(null);
  const sheetDrag = useRef<{ originY: number; startHeight: number; height: number } | null>(null);
  const ignoreSheetClick = useRef(false);

  const activeCardId = desktop ? cardId ?? desktopCardId : cardId;
  const panelExpanded = searchParams.get("panel") === "expanded";
  const sheetHeight = sheetSizing.cardId === activeCardId ? sheetSizing.height : null;
  const setSheetHeight = (height: number | null) => setSheetSizing({ cardId: activeCardId, height });
  const card = cardForId(cards, activeCardId);
  const index = card ? cards.findIndex((item) => item.id === card.id) : 0;
  const result = card ? matchScholarship(card, state.profile) : undefined;

  const close = useCallback(() => {
    setSheetSizing({ cardId: null, height: null });
    router.push(ROUTES.discover, { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!card) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, close]);

  useEffect(() => {
    detailPane.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeCardId]);

  const collapsedSheetHeight = () => Math.min(window.innerHeight * 0.62, 544);
  const expandedSheetHeight = () => window.innerHeight - 8;

  const startSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startHeight = sheetHeight ?? (panelExpanded ? expandedSheetHeight() : collapsedSheetHeight());
    sheetDrag.current = { originY: event.clientY, startHeight, height: startHeight };
    setDraggingSheet(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!sheetDrag.current) return;
    if (sheetDrag.current.startHeight > window.innerHeight * 0.78 && event.clientY - sheetDrag.current.originY > 96) {
      sheetDrag.current = null;
      setDraggingSheet(false);
      close();
      return;
    }
    const nextHeight = Math.max(
      collapsedSheetHeight(),
      Math.min(expandedSheetHeight(), sheetDrag.current.startHeight + sheetDrag.current.originY - event.clientY)
    );
    if (Math.abs(event.clientY - sheetDrag.current.originY) > 4) ignoreSheetClick.current = true;
    sheetDrag.current.height = nextHeight;
    setSheetHeight(nextHeight);
  };

  const endSheetDrag = () => {
    if (!sheetDrag.current) return;
    const shouldExpand = sheetDrag.current.height > window.innerHeight * 0.78;
    setSheetHeight(shouldExpand ? expandedSheetHeight() : collapsedSheetHeight());
    sheetDrag.current = null;
    setDraggingSheet(false);
  };

  const detail = card && (
    <ScholarshipDetail
      className="[&_.t-display-xl]:text-[2.25rem] [&_.t-display-xl]:leading-[1] lg:[&_.t-display-xl]:text-[2.5rem]"
      card={card}
      index={index}
      result={result}
      matchExplanation={<AiMatchSummary result={result} />}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[88rem] flex-none items-end justify-between gap-4 px-5 pt-6 pb-6 sm:px-8 lg:pt-7">
        <div>
          <h1 id="deck-heading" className="t-display-lg">{t("yourScholarships")}</h1>
          <p className="t-body mt-2 text-ink-mute">Explore each published scholarship and its requirements.</p>
        </div>
        {deckTotal > 0 && <p className="t-caption t-num whitespace-nowrap text-ink-mute">{deckPosition + 1} of {deckTotal}</p>}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col lg:grid lg:transition-[grid-template-columns] lg:duration-500 lg:ease-[cubic-bezier(.16,1,.3,1)]", card ? "lg:grid-cols-[minmax(0,1fr)_min(42rem,46vw)]" : "lg:grid-cols-[minmax(0,1fr)_0px]")}>
        <MatchCelebration />
        <Deck detailOpen={Boolean(card) && !desktop} onCardChange={(id) => {
          if (desktop) setDesktopCardId(id);
        }} onPositionChange={(position, total) => {
          setDeckPosition(position);
          setDeckTotal(total);
        }} />

      <aside aria-label="Scholarship details" className="hidden overflow-hidden border-l border-hairline bg-canvas lg:block">
        {card && <div ref={detailPane} className="h-full min-h-0 overflow-y-auto overscroll-contain [animation:discover-detail-in_360ms_cubic-bezier(.16,1,.3,1)_both]">{detail}</div>}
      </aside>

      <Sheet
        open={Boolean(card) && !desktop}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {card && (
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(
              "max-h-[calc(100dvh-0.5rem)] gap-0 overflow-hidden rounded-t-xl bg-canvas p-0 pb-[env(safe-area-inset-bottom)] text-ink transition-[height,box-shadow,transform] duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)] data-starting-style:!opacity-100 data-ending-style:!opacity-100 data-[side=bottom]:data-starting-style:!translate-y-[calc(100%-3.25rem)] data-[side=bottom]:data-ending-style:!translate-y-[calc(100%-3.25rem)] motion-reduce:transition-none lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[min(42rem,46vw)] lg:rounded-none lg:border-l lg:[animation:discover-detail-in_360ms_cubic-bezier(.16,1,.3,1)_both]",
              draggingSheet && !reduced && "will-change-[height] transition-none"
            )}
            style={{ height: sheetHeight ? `${sheetHeight}px` : panelExpanded ? "calc(100dvh - 0.5rem)" : "min(62dvh, 34rem)" }}
          >
            <SheetTitle className="sr-only">
              {card.title} — {card.provider}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Published requirements, documents and official sources.
            </SheetDescription>
            <div className="sticky top-0 z-10 flex h-14 flex-none items-center justify-center border-b border-hairline bg-canvas/95 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                aria-label="Drag down to close scholarship details"
                aria-describedby="detail-sheet-instructions"
                onPointerDown={startSheetDrag}
                onPointerMove={moveSheetDrag}
                onPointerUp={endSheetDrag}
                onPointerCancel={endSheetDrag}
                onClick={() => {
                  if (ignoreSheetClick.current) {
                    ignoreSheetClick.current = false;
                    return;
                  }
                  close();
                }}
                className="ring-brand flex h-12 w-full touch-none items-center justify-center active:bg-canvas-soft"
              >
                <span className="h-1 w-12 rounded-full bg-ink/45" aria-hidden="true" />
              </button>
              <span id="detail-sheet-instructions" className="sr-only">Drag this bar down to close the scholarship details.</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{detail}</div>
          </SheetContent>
        )}
      </Sheet>
      </div>
    </div>
  );
}
