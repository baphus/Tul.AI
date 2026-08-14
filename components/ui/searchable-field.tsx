"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { CheckIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A searchable field for the onboarding conversation.
 *
 * Base UI's `Autocomplete` rather than `Combobox` or `Select`, deliberately: the
 * value is free-form text that the list only *suggests*. A student whose course
 * or school is not on our list must still be able to answer — an unlisted
 * programme is a gap in our reference data, never a reason to block someone
 * (AGENTS.md §3 in spirit: absence of data is not a failure).
 *
 * So `value` is the plain string the profile stores, and the list is a shortcut
 * to typing it. Selecting an item and typing the same text produce identical
 * state.
 *
 * Design system: `edge-ink`-adjacent hairline input at the shared h-12/rounded-md
 * geometry the other onboarding fields use, and a popup at DESIGN.md's card
 * radius. `--anchor-width` keeps the popup aligned to the field.
 */

const POPUP =
  "w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-xl border border-hairline bg-canvas shadow-[0_12px_32px_-12px_rgba(14,15,12,0.22)]";

const LIST =
  "max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5 outline-0 data-empty:p-0";

const ITEM =
  "flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2.5 outline-hidden select-none data-highlighted:bg-ink data-highlighted:text-white";

export interface SearchableFieldProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Rendered when the query matches nothing — say what happens next. */
  emptyMessage?: string;
  className?: string;
}

/** A flat list of plain strings. */
export function SearchableField({
  id,
  value,
  onValueChange,
  placeholder,
  autoFocus,
  emptyMessage = "No match — your answer is kept as typed.",
  items,
  className,
  itemContent,
}: SearchableFieldProps & {
  items: string[];
  /** Optional richer suggestion content; the stored value remains the item string. */
  itemContent?: (item: string) => ReactNode;
}) {
  return (
    <Autocomplete.Root
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      openOnInputClick
      autoHighlight
    >
      <div className={cn("relative", className)}>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <Autocomplete.Input
          id={id}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="ring-brand t-body h-12 w-full rounded-md border border-hairline bg-canvas pr-4 pl-11 text-ink placeholder:text-ink-faint"
        />
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="z-100 outline-hidden">
          <Autocomplete.Popup className={POPUP}>
            <Autocomplete.Empty>
              <p className="t-caption px-3 py-4 text-ink-mute">{emptyMessage}</p>
            </Autocomplete.Empty>
            <Autocomplete.List className={LIST}>
              {(item: string) => (
                <Autocomplete.Item key={item} value={item} className={`${ITEM} group`}>
                  {itemContent ? (
                    <span className="min-w-0 flex-1">{itemContent(item)}</span>
                  ) : (
                    <span className="t-body min-w-0 flex-1 truncate">{item}</span>
                  )}
                  {item === value && (
                    <CheckIcon className="size-3.5 flex-none" aria-hidden="true" />
                  )}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

export interface SearchableGroup<T> {
  value: string;
  items: T[];
}

/**
 * A grouped list. Used for the course field, where 120 programmes are only
 * scannable once they sit under their discipline.
 */
export function SearchableGroupedField<T>({
  id,
  value,
  onValueChange,
  placeholder,
  autoFocus,
  emptyMessage = "No match — your answer is kept as typed.",
  groups,
  itemLabel,
  itemNote,
  className,
}: SearchableFieldProps & {
  groups: SearchableGroup<T>[];
  itemLabel: (item: T) => string;
  itemNote?: (item: T) => string | undefined;
}) {
  return (
    <Autocomplete.Root
      items={groups}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      itemToStringValue={(item) => itemLabel(item as T)}
      openOnInputClick
      autoHighlight
    >
      <div className={cn("relative", className)}>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <Autocomplete.Input
          id={id}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="ring-brand t-body h-12 w-full rounded-md border border-hairline bg-canvas pr-4 pl-11 text-ink placeholder:text-ink-faint"
        />
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="z-100 outline-hidden">
          <Autocomplete.Popup className={POPUP}>
            <Autocomplete.Empty>
              <p className="t-caption px-3 py-4 text-ink-mute">{emptyMessage}</p>
            </Autocomplete.Empty>
            <Autocomplete.List className={LIST}>
              {(group: SearchableGroup<T>) => (
                <Autocomplete.Group
                  key={group.value}
                  items={group.items}
                  className="block pb-1.5 last:pb-0"
                >
                  <Autocomplete.GroupLabel className="t-eyebrow px-3 pt-3 pb-1.5 text-ink-faint select-none">
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(item: T) => {
                      const label = itemLabel(item);
                      const note = itemNote?.(item);
                      return (
                        <Autocomplete.Item key={label} value={item} className={ITEM}>
                          <span className="min-w-0 flex-1">
                            <span className="t-body block truncate">{label}</span>
                            {note && (
                              <span className="t-micro block truncate text-ink-faint group-data-highlighted:text-white/70">
                                {note}
                              </span>
                            )}
                          </span>
                          {label === value && (
                            <CheckIcon className="size-3.5 flex-none" aria-hidden="true" />
                          )}
                        </Autocomplete.Item>
                      );
                    }}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
