"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { Deck } from "@/components/app/deck";
import { ShortlistPanel } from "@/components/app/shortlist-panel";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTulAi } from "@/hooks/use-tul-ai";
import { cardIndexOf, ROUTES } from "@/lib/logic/routes";

/**
 * Discover = the deck plus one companion column. Opening a record never moves
 * the deck: the full record rises as a centred popup over the page, so the
 * shortlist column stays put and closing the popup restores the exact layout.
 * The open record lives in the URL (`?card=`), so it is shareable and Back
 * closes it.
 */
export function DiscoverScreen({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const { cards } = useTulAi();

  const index = cardIndexOf(cardId);
  const card = index >= 0 ? cards[index] : null;

  const close = useCallback(() => {
    router.push(ROUTES.discover, { scroll: false });
  }, [router]);

  /* Escape closes the popup — the dialog handles its own focus and backdrop. */
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, close]);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
      <div className="flex min-h-0 flex-1 flex-col">
        <Deck detailOpen={Boolean(card)} />
      </div>

      {/* The shortlist never moves — the popup overlays it when a card opens. */}
      <aside className="hidden min-h-0 border-l border-hairline lg:block lg:overflow-y-auto">
        <ShortlistPanel />
      </aside>

      <Sheet
        open={Boolean(card)}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {card && (
          <SheetContent
            side="center"
            showCloseButton={false}
            className="gap-0 overflow-y-auto rounded-2xl bg-canvas p-0 text-ink"
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
                    className="size-9 rounded-md border-hairline bg-canvas/70"
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
