"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Deck } from "@/components/app/deck";
import { MatchCelebration } from "@/components/app/match-celebration";
import { AiMatchSummary } from "@/components/scholarship/ai-match-summary";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTulAi } from "@/hooks/use-tul-ai";
import { useIsDesktop } from "@/hooks/use-media-query";
import { matchScholarship } from "@/lib/logic/matching";
import { cardIndexOf, ROUTES } from "@/lib/logic/routes";
import { cn } from "@/lib/utils";

/**
 * Discover keeps one opportunity in focus. Details rise beside it on desktop
 * and from the bottom on phones, so closing the record returns to the same
 * decision without reorienting the student.
 */
export function DiscoverScreen({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const { cards, state } = useTulAi();
  const desktop = useIsDesktop();
  const [desktopCardId, setDesktopCardId] = useState<string | null>(null);
  const detailPane = useRef<HTMLDivElement>(null);

  const activeCardId = desktop
    ? desktopCardId ?? cardId ?? cards[0]?.id ?? null
    : cardId;
  const routeIndex = cardIndexOf(activeCardId);
  const index = routeIndex >= 0 ? routeIndex : 0;
  const card = routeIndex >= 0 ? cards[routeIndex] : desktop ? cards[0] ?? null : null;
  const result = card ? matchScholarship(card, state.profile) : undefined;

  const close = useCallback(() => {
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
    <div className={cn("flex min-h-0 flex-1 flex-col lg:grid lg:transition-[grid-template-columns] lg:duration-500 lg:ease-[cubic-bezier(.16,1,.3,1)]", card ? "lg:grid-cols-[minmax(0,1fr)_min(42rem,46vw)]" : "lg:grid-cols-[minmax(0,1fr)_0px]")}>
      <MatchCelebration />
      <Deck detailOpen={Boolean(card) && !desktop} onCardChange={(id) => {
        if (desktop) setDesktopCardId(id);
      }} />

      <aside aria-label="Scholarship details" className="hidden overflow-hidden border-l border-hairline bg-canvas lg:block">
        {card && <div ref={detailPane} className="h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain [animation:discover-detail-in_360ms_cubic-bezier(.16,1,.3,1)_both]">{detail}</div>}
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
            className="h-[100dvh] max-h-[100dvh] gap-0 overflow-y-auto overscroll-contain bg-canvas p-0 pb-[env(safe-area-inset-bottom)] text-ink lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[min(42rem,46vw)] lg:rounded-none lg:border-l lg:[animation:discover-detail-in_360ms_cubic-bezier(.16,1,.3,1)_both]"
          >
            <SheetTitle className="sr-only">
              {card.title} — {card.provider}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Published requirements, documents and official sources.
            </SheetDescription>
            <div className="sticky top-0 z-10 flex h-14 flex-none items-center justify-end border-b border-hairline bg-canvas/95 px-5 backdrop-blur-sm sm:px-8 lg:hidden">
              <Button variant="outline" size="icon-lg" className="border-hairline bg-canvas" aria-label="Close details" onClick={close}>
                <XIcon />
              </Button>
            </div>
            {detail}
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
