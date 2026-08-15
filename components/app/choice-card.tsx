"use client";

import { InfoIcon } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A single answer in the conversation.
 *
 * Built on a real `<input type="radio">` (visually hidden) so arrow-key
 * navigation, grouping and screen-reader semantics come from the platform
 * rather than from ARIA we'd have to maintain. The number badge doubles as the
 * keyboard shortcut hint.
 */
export function ChoiceCard({
  name,
  value,
  label,
  note,
  shortcut,
  checked,
  onSelect,
  className,
  noteVisible = false,
}: {
  name: string;
  value: string;
  label: string;
  note?: string;
  shortcut?: number;
  checked: boolean;
  onSelect: (value: string) => void;
  className?: string;
  noteVisible?: boolean;
}) {
  const [showNote, setShowNote] = useState(false);
  const noteId = useId();

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-canvas transition-colors",
        "border-hairline hover:border-hairline-dark/40",
        "has-checked:border-ink has-checked:bg-ink/4",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
        className
      )}
    >
      <label className="flex cursor-pointer items-start gap-3.5 p-4 pr-12">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onSelect(value)}
          className="sr-only"
        />

        {shortcut !== undefined && (
          <span
            className="t-micro t-num mt-0.5 grid size-6 flex-none place-items-center rounded-sm border border-hairline text-ink-mute transition-colors group-has-checked:border-ink group-has-checked:bg-ink group-has-checked:text-white"
            aria-hidden="true"
          >
            {shortcut}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="t-body-strong block text-ink">{label}</span>
        </span>
      </label>

      {note && noteVisible && (
        <p className="mx-4 mb-4 rounded-md bg-canvas-soft px-3 py-2 t-caption text-ink-mute">
          {note}
        </p>
      )}

      {note && !noteVisible && (
        <>
          <button
            type="button"
            className="ring-brand absolute top-4 right-4 grid size-6 place-items-center rounded-full border border-hairline text-ink-mute hover:border-ink hover:text-ink"
            aria-label={`Show more information about ${label}`}
            aria-expanded={showNote}
            aria-controls={noteId}
            onClick={() => setShowNote((visible) => !visible)}
          >
            <InfoIcon className="size-4" aria-hidden="true" />
          </button>
          {showNote && (
            <p id={noteId} className="mx-4 mb-4 rounded-md bg-canvas-soft px-3 py-2 t-caption text-ink-mute">
              {note}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function InfoHint({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hintId = useId();

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="ring-brand inline-grid size-6 place-items-center rounded-full border border-hairline text-ink-mute hover:border-ink hover:text-ink"
        aria-label={label}
        aria-expanded={open}
        aria-controls={hintId}
        onClick={() => setOpen((visible) => !visible)}
      >
        <InfoIcon className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={hintId}
          role="status"
          className="absolute top-8 left-0 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-hairline bg-canvas p-3 text-left shadow-[0_12px_32px_-12px_rgba(14,15,12,0.22)]"
        >
          <p className="t-caption text-ink-mute text-pretty">{children}</p>
        </div>
      )}
    </div>
  );
}

/** A multi-select chip for the optional circumstances question. */
export function ChoiceChip({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "ring-brand t-caption rounded-full border px-4 py-2.5 transition-colors",
        pressed
          ? "border-ink bg-ink text-white"
          : "border-hairline bg-canvas text-ink-mute hover:border-hairline-dark/40 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
