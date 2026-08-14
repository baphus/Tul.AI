"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The hand-off (PRD §25). Tul.AI is discovery; the application and the decision
 * belong to the provider. The interstitial names the destination host and says
 * plainly who decides before anyone leaves.
 */
export function ApplyDialog({
  card,
  className,
  label = "Continue to official application",
}: {
  card: Scholarship;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className={cn("h-12 rounded-md px-6", className)}
        onClick={() => setOpen(true)}
      >
        {label}
        <ExternalLinkIcon />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-xl bg-canvas px-6 pt-4 pb-10 text-ink sm:mx-auto sm:max-w-lg"
        >
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-hairline" aria-hidden="true" />
          <SheetTitle className="t-display-lg text-balance">
            You&apos;re heading to the official scholarship provider.
          </SheetTitle>
          <SheetDescription className="t-body mt-3 text-ink-mute text-pretty">
            Tul.AI helps you discover and understand opportunities. Your application is
            completed directly with {card.provider}, who makes the final decision.
          </SheetDescription>

          <p className="mt-5 flex items-center gap-2.5 rounded-md border border-hairline bg-canvas-soft px-4 py-3">
            <span className="size-1.5 rounded-full bg-met" aria-hidden="true" />
            <span className="t-body-strong flex-1 break-all">{card.host}</span>
            <span className="t-micro text-ink-mute">Official</span>
          </p>

          <p className="t-caption mt-4 text-ink-mute">
            Check the programme page for the current application form — published
            requirements can change after our last check.
          </p>

          {card.applicationUrl ? <ButtonLink
            className="mt-6 h-12 w-full rounded-md"
            href={card.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            Continue to {card.host}
            <ExternalLinkIcon />
          </ButtonLink> : <p className="t-caption mt-6 rounded-md border border-hairline bg-canvas-soft p-4 text-ink-mute">The provider has not published a direct application link. Use its official source to check the current process.</p>}
          <Button
            variant="ghost"
            className="mt-2 h-11 w-full text-ink-mute"
            onClick={() => setOpen(false)}
          >
            Not now
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
