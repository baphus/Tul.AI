"use client";

import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/logic/deadlines";
import {
  PROVIDER_GROUPS,
  summariseSupport,
  type ProviderGroup,
  type SummarisableScholarship,
} from "@/lib/logic/estimate";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";

/**
 * DESIGN.md `currency-converter-card` — the brand's signature hero widget,
 * adapted. Wise puts an amount in and shows you exactly what arrives, with the
 * fee broken out; this puts a kind of provider in and shows exactly what is
 * published, with the verification broken out.
 *
 * It is a description of the data set, not an eligibility check (AGENTS.md §3):
 * it takes no student attribute, produces no score, and says in the card itself
 * that the provider decides. The range is a range and never a total — some
 * programmes publish per year and others per semester.
 */
export function SupportEstimator({
  cards,
  className,
}: {
  cards: readonly SummarisableScholarship[];
  className?: string;
}) {
  const selectId = useId();
  const [group, setGroup] = useState<ProviderGroup>("all");
  const summary = useMemo(() => summariseSupport(cards, group), [cards, group]);

  const rows: [string, string][] = [
    [
      "Support published",
      summary.lowest === null || summary.highest === null
        ? "—"
        : summary.lowest === summary.highest
          ? formatPeso(summary.lowest)
          : `${formatPeso(summary.lowest)} – ${formatPeso(summary.highest)}`,
    ],
    [
      "Soonest deadline",
      summary.soonestDeadlineIso ? formatIsoDate(summary.soonestDeadlineIso) : "—",
    ],
    [
      "Confirmed against source",
      summary.count === 0
        ? "—"
        : `${summary.verifiedCount} of ${summary.count} records`,
    ],
  ];

  return (
    <div
      className={`edge-ink rounded-xl bg-canvas p-6 text-ink sm:p-7 ${className ?? ""}`}
    >
      <label htmlFor={selectId} className="t-caption-strong block text-ink">
        Show me what&apos;s published by
      </label>

      <div className="edge-ink relative mt-2 rounded-md">
        <select
          id={selectId}
          value={group}
          onChange={(event) => setGroup(event.target.value as ProviderGroup)}
          className="ring-brand t-body w-full appearance-none rounded-md bg-canvas py-3 pr-11 pl-4 text-ink"
        >
          {PROVIDER_GROUPS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink"
          aria-hidden="true"
        />
      </div>

      {/* The "they receive" half of the converter: the computed answer. */}
      <div
        className="mt-4 flex items-center justify-between gap-4 rounded-md bg-canvas-soft px-4 py-3.5"
        aria-live="polite"
      >
        {/* Every record in the group, not just the confirmed ones — the
            confirmed count is its own line below, and conflating the two would
            overstate the verification state (AGENTS.md §3). */}
        <span className="t-caption-strong text-ink">Programmes published</span>
        <span className="t-display-lg t-num text-ink">{summary.count}</span>
      </div>

      <dl className="mt-5">
        {rows.map(([term, value], i) => (
          <div
            key={term}
            className={`flex items-baseline justify-between gap-4 py-2.5 ${
              i === 0 ? "" : "border-t border-hairline"
            }`}
          >
            <dt className="t-caption text-ink-mute">{term}</dt>
            <dd className="t-caption-strong t-num text-right text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          className="t-body-strong h-12 w-full px-6 text-base sm:w-auto"
          render={<Link href={ROUTES.onboarding} />}
        >
          Find my scholarships
        </Button>
        <Link
          href={ROUTES.scholarships}
          className="ring-brand t-caption-strong inline-flex items-center gap-1.5 rounded-xs px-1 text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
        >
          See the records
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <p className="t-micro mt-5 text-ink-mute">
        Amounts are what each provider publishes. Tul.AI does not decide who
        qualifies — the provider does.
      </p>
    </div>
  );
}
