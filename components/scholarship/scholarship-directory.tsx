"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { ScholarshipSummaryCard } from "@/components/scholarship/scholarship-summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Scholarship, ScholarshipKind } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

type KindFilter = "all" | ScholarshipKind;
type Sort = "deadline" | "amount" | "requirements";

const KINDS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "national", label: "National" },
  { value: "lgu", label: "City & province" },
  { value: "university", label: "University" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "deadline", label: "Closing soonest" },
  { value: "amount", label: "Largest benefit" },
  { value: "requirements", label: "Most requirements met" },
];

/**
 * The public directory (PRD §36 "search/filter"). Everything is client-side over
 * the full record set — no ranking is applied here, because ranking is personal
 * and belongs to the matched deck, not to a browsable list.
 */
export function ScholarshipDirectory({ cards }: { cards: Scholarship[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<Sort>("deadline");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => (kind === "all" ? true : card.kind === kind))
      .filter(({ card }) =>
        q === ""
          ? true
          : [card.title, card.provider, card.back.about, ...card.needs]
              .join(" ")
              .toLowerCase()
              .includes(q)
      );

    return filtered.sort((a, b) => {
      if (sort === "amount") return b.card.amount - a.card.amount;
      if (sort === "requirements") {
        return b.card.met / b.card.total - a.card.met / a.card.total;
      }
      return a.card.deadlineIso.localeCompare(b.card.deadlineIso);
    });
  }, [cards, kind, query, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-soft p-5">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="h-12 rounded-md border-hairline bg-canvas pl-10"
            placeholder="Search by programme, provider or document"
            aria-label="Search scholarships"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by provider type">
            {KINDS.map((option) => {
              const active = kind === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    "ring-brand t-micro rounded-full border px-3.5 py-2 transition-colors",
                    active
                      ? "border-indigo bg-indigo text-white"
                      : "border-hairline bg-canvas text-ink-mute hover:text-ink"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="t-micro text-ink-mute">Sort</span>
            {SORTS.map((option) => {
              const active = sort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSort(option.value)}
                  className={cn(
                    "ring-brand t-micro rounded-full border px-3 py-1.5 transition-colors",
                    active
                      ? "border-hairline-dark bg-canvas text-ink"
                      : "border-transparent text-ink-mute hover:text-ink"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="t-caption mt-6 text-ink-mute" aria-live="polite">
        {results.length === cards.length
          ? `${cards.length} verified ${cards.length === 1 ? "programme" : "programmes"}`
          : `${results.length} of ${cards.length} programmes`}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-hairline-dark/30 p-10 text-center">
          <p className="t-display-md">Nothing matches that search.</p>
          <p className="t-caption mx-auto mt-3 max-w-sm text-ink-mute text-pretty">
            Coverage is Cebu-first for now, so a programme may simply not be in the set
            yet. Try a provider name, or clear the filters.
          </p>
          <Button
            variant="outline"
            className="mt-6 h-11 rounded-md border-hairline-dark"
            onClick={() => {
              setQuery("");
              setKind("all");
            }}
          >
            Clear search and filters
          </Button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {results.map(({ card, index }) => (
            <li key={card.id}>
              <ScholarshipSummaryCard card={card} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
