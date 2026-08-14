"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { Deck } from "@/components/app/deck";
import { MatchCelebration } from "@/components/app/match-celebration";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTulAi } from "@/hooks/use-tul-ai";
import { matchScholarship } from "@/lib/logic/matching";
import { cardIndexOf, ROUTES } from "@/lib/logic/routes";

/**
 * Discover keeps one opportunity in focus. Details rise beside it on desktop
 * and from the bottom on phones, so closing the record returns to the same
 * decision without reorienting the student.
 */
export function DiscoverScreen({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const { cards, state } = useTulAi();

  const index = cardIndexOf(cardId);
  const card = index >= 0 ? cards[index] : null;
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MatchCelebration />
      <Deck detailOpen={Boolean(card)} />

      <Sheet
        open={Boolean(card)}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {card && (
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[min(88dvh,52rem)] gap-0 overflow-y-auto rounded-t-2xl bg-canvas p-0 text-ink lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[min(42rem,46vw)] lg:rounded-none lg:border-l"
          >
            <SheetTitle className="sr-only">
              {card.title} — {card.provider}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Published requirements, documents and official sources.
            </SheetDescription>
            <ScholarshipDetail
              card={card}
              index={index}
              result={result}
              topSlot={
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={ROUTES.scholarship(card.id)}
                    className="ring-brand t-caption rounded-xs text-ink-mute underline decoration-hairline-dark/40 underline-offset-4 hover:text-ink"
                  >
                    Open as a page
                  </Link>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="border-hairline bg-canvas"
                    aria-label="Close details"
                    onClick={close}
                  >
                    <XIcon />
                  </Button>
                </div>
              }
            />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
