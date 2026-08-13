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
import { useIsDesktop } from "@/hooks/use-media-query";
import { useTulAi } from "@/hooks/use-tul-ai";
import { cardIndexOf, ROUTES } from "@/lib/logic/routes";

/**
 * Discover = the deck plus one companion column. On desktop the full record
 * opens beside the deck; on a phone it rises as a sheet. Either way the open
 * record is in the URL (`?card=`), so it is shareable and Back closes it.
 */
export function DiscoverScreen({ cardId }: { cardId: string | null }) {
  const router = useRouter();
  const { cards } = useTulAi();
  const isDesktop = useIsDesktop();

  const index = cardIndexOf(cardId);
  const card = index >= 0 ? cards[index] : null;

  const close = useCallback(() => {
    router.push(ROUTES.discover, { scroll: false });
  }, [router]);

  /* Escape closes the desktop pane; the sheet handles its own. */
  useEffect(() => {
    if (!card || !isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, close, isDesktop]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="flex min-h-0 flex-1 flex-col">
          <Deck detailOpen={Boolean(card)} />
        </div>

        <aside className="hidden min-h-0 border-l border-hairline lg:block lg:overflow-y-auto">
          {card ? (
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
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close details"
                    onClick={close}
                  >
                    <XIcon />
                  </Button>
                </div>
              }
            />
          ) : (
            <ShortlistPanel />
          )}
        </aside>
      </div>

      {!isDesktop && (
        <Sheet
          open={Boolean(card)}
          onOpenChange={(next) => {
            if (!next) close();
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="data-[side=bottom]:h-[94dvh] gap-0 overflow-y-auto rounded-t-xl bg-canvas p-0 text-ink lg:hidden"
          >
            {card && (
              <>
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
                      <span
                        className="mx-auto h-1 w-9 rounded-full bg-hairline"
                        aria-hidden="true"
                      />
                      <Button
                        variant="outline"
                        size="icon-lg"
                        className="size-9 flex-none rounded-md border-hairline bg-canvas/70"
                        aria-label="Close details"
                        onClick={close}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  }
                />
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
