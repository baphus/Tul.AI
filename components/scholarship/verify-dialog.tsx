"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { formatIsoDate } from "@/lib/logic/deadlines";
import { VERIFY_LABELS, type Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * "Verify this scholarship" (PRD §24). Re-reads the provider's published notice
 * and reports what it found — including what it could not confirm. It never
 * restates the result as a chance of being awarded.
 */
export function VerifyDialog({ card }: { card: Scholarship }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();

  const clear = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const start = () => {
    clear();
    setStep(0);
    setOpen(true);
    const gap = reduced ? 260 : 620;
    VERIFY_LABELS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStep(i + 1), (i + 1) * gap));
    });
  };

  const done = step >= VERIFY_LABELS.length;

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="ring-brand flex w-full items-center gap-3 rounded-lg border border-hairline bg-canvas-soft p-4 text-left transition-colors hover:border-hairline-dark/30"
      >
        <span
          className="grid size-8 flex-none place-items-center rounded-md bg-indigo text-white"
          aria-hidden="true"
        >
          <SparklesIcon className="size-4" />
        </span>
        <span className="flex-1">
          <span className="t-body-strong block">Ask Tul.AI to verify</span>
          <span className="t-caption block text-ink-mute">
            Re-check the provider&apos;s published information
          </span>
        </span>
      </button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) clear();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="data-[side=bottom]:max-h-[88dvh] gap-0 overflow-y-auto rounded-t-xl bg-canvas px-6 pt-4 pb-10 text-ink sm:mx-auto sm:max-w-lg"
        >
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-hairline" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 flex-none place-items-center rounded-md bg-indigo text-white"
              aria-hidden="true"
            >
              <SparklesIcon className="size-3.5" />
            </span>
            <SheetTitle className="t-display-md">
              {done ? "Checked just now" : "Checking official sources…"}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Tul.AI re-reads the published notice for {card.provider}.
          </SheetDescription>

          <ol className="mt-5 flex flex-col gap-3" aria-live="polite">
            {VERIFY_LABELS.map((label, i) => {
              const checked = i < step;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-5 flex-none items-center justify-center rounded-full transition-colors",
                      checked ? "bg-met text-white" : "border-[1.5px] border-hairline"
                    )}
                    aria-hidden="true"
                  >
                    {checked && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn("t-caption", checked ? "text-ink" : "text-ink-mute")}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {done && (
            <div className="mt-6 [animation:rise_300ms_cubic-bezier(.2,.8,.3,1)_both]">
              <div className="h-px bg-hairline" />
              <h3 className="t-display-md mt-5">What Tul.AI found</h3>
              <p className="t-body mt-2 text-ink-mute text-pretty">{card.verify}</p>

              <ul className="mt-5 flex flex-col gap-2">
                {card.sources.map((source) => (
                  <li
                    key={source.name}
                    className="flex items-center gap-2.5 rounded-md border border-hairline bg-canvas px-3 py-2.5"
                  >
                    <span className="size-1.5 rounded-full bg-met" aria-hidden="true" />
                    <span className="t-caption flex-1">{source.name}</span>
                    <span className="t-micro text-ink-mute">{source.short}</span>
                  </li>
                ))}
              </ul>
              <p className="t-micro mt-3 text-ink-mute">
                {card.sources.length} official{" "}
                {card.sources.length === 1 ? "source" : "sources"} checked · record last
                verified <time dateTime={card.lastVerified}>{formatIsoDate(card.lastVerified)}</time>
              </p>

              <Button
                className="mt-6 h-12 w-full rounded-md"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
