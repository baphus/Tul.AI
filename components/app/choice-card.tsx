"use client";

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
}: {
  name: string;
  value: string;
  label: string;
  note?: string;
  shortcut?: number;
  checked: boolean;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3.5 rounded-lg border bg-canvas p-4 transition-colors",
        "border-hairline hover:border-hairline-dark/40",
        "has-checked:border-ink has-checked:bg-ink/4",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
        className
      )}
    >
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
        {note && <span className="t-caption mt-1 block text-ink-mute">{note}</span>}
      </span>
    </label>
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
