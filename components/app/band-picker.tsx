"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { ChoiceCard } from "@/components/app/choice-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WITHHELD, type Band } from "@/lib/reference/bands";
import { cn } from "@/lib/utils";

/**
 * A band of cards plus a collapsed exact-value input.
 *
 * The band is the primary answer and the exact figure is genuinely optional
 * (AGENTS.md §9, spec §2.5) — a range discloses less than a precise academic
 * record for the same matching power, so the UI asks for the range and offers the
 * precision rather than the other way round.
 *
 * The disclosure is not decoration. A band that straddles a published minimum
 * resolves to Unknown, and the exact figure is the only thing that can settle it
 * — so the summary says exactly that, and opens itself when there is a value to
 * show.
 */
export function BandPicker({
  name,
  bands,
  band,
  onBandChange,
  exact,
  onExactChange,
  exactLabel,
  exactHint,
  exactPlaceholder,
  exactError,
  exactErrorMessage,
  exactInputMode = "decimal",
  withheldLabel,
  disclosureLabel,
  displayValue = (value) => value,
  displayNote = (note) => note,
}: {
  name: string;
  bands: Band[];
  band: string;
  onBandChange: (value: string) => void;
  exact: string;
  onExactChange: (value: string) => void;
  exactLabel: string;
  exactHint?: string;
  exactPlaceholder?: string;
  exactError?: boolean;
  exactErrorMessage?: string;
  exactInputMode?: "decimal" | "numeric";
  /** Set to offer "Prefer not to say" as a final card. */
  withheldLabel?: string;
  disclosureLabel: string;
  displayValue?: (value: string) => string;
  displayNote?: (note: string) => string;
}) {
  const exactId = useId();
  const errorId = `${exactId}-error`;
  const hintId = `${exactId}-hint`;
  /* Opens itself when a figure is already stored, so an answer is never hidden
     behind a collapsed summary the student has to remember to open. */
  const [open, setOpen] = useState(exact.trim() !== "");

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="sr-only">{name}</legend>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {bands.map((option, i) => (
            <ChoiceCard
              key={option.value}
              name={name}
              value={option.value}
              label={displayValue(option.value)}
              note={option.note ? displayNote(option.note) : undefined}
              shortcut={i + 1}
              checked={band === option.value}
              onSelect={onBandChange}
            />
          ))}
          {withheldLabel && (
            <ChoiceCard
              name={name}
              value={WITHHELD}
              label={withheldLabel}
              note={displayNote("Treated as unknown — never as a requirement you failed")}
              shortcut={bands.length + 1}
              checked={band === WITHHELD}
              onSelect={onBandChange}
            />
          )}
        </div>
      </fieldset>

      <div className="rounded-lg border border-hairline bg-canvas-soft/60">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((was) => !was)}
          className="ring-brand t-caption-strong flex w-full items-center gap-2 rounded-lg px-4 py-3.5 text-left text-ink"
        >
          <ChevronDownIcon
            className={cn(
              "size-4 flex-none text-ink-mute transition-transform",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
          {disclosureLabel}
        </button>

        {open && (
          <div className="grid gap-2.5 border-t border-hairline px-4 pt-4 pb-4.5 sm:max-w-xs">
            <Label htmlFor={exactId}>{exactLabel}</Label>
            <Input
              id={exactId}
              inputMode={exactInputMode}
              className="h-12 rounded-md border-hairline bg-canvas px-4"
              placeholder={exactPlaceholder}
              value={exact}
              aria-invalid={exactError}
              aria-describedby={exactError ? errorId : exactHint ? hintId : undefined}
              onChange={(event) => onExactChange(event.target.value)}
            />
            {exactError && exactErrorMessage ? (
              <p id={errorId} role="alert" className="t-micro text-destructive">
                {exactErrorMessage}
              </p>
            ) : (
              exactHint && (
                <p id={hintId} className="t-micro text-ink-mute text-pretty">
                  {exactHint}
                </p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
