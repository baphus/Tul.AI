/**
 * Support summaries for the hero card.
 *
 * DESIGN.md's signature component is a currency converter: you choose an input
 * and it shows you, transparently, what comes out the other side. The same
 * shape here answers "what is published for this kind of provider" — a count, a
 * range and the nearest deadline, read straight off the verified data set.
 *
 * This is deliberately NOT an eligibility check (AGENTS.md §3). It never takes
 * a student attribute, never scores anything, and never claims a student
 * qualifies. It describes the data set; the engine decides matches, and the
 * provider decides outcomes.
 */

import type { Scholarship, ScholarshipKind } from "@/lib/scholarships";

export type ProviderGroup = "all" | ScholarshipKind;

/** Only the fields a summary reads — so callers and tests stay cheap. */
export type SummarisableScholarship = Pick<
  Scholarship,
  "kind" | "amount" | "deadlineIso" | "lastVerified" | "verification"
>;

export interface SupportSummary {
  group: ProviderGroup;
  /** How many published programmes sit in this group. */
  count: number;
  /** How many of those carry a `Verified` state right now. */
  verifiedCount: number;
  /** Published support range, in pesos. `null` when the group is empty. */
  lowest: number | null;
  highest: number | null;
  /** ISO date of the nearest deadline in the group, or `null` when empty. */
  soonestDeadlineIso: string | null;
  /** ISO date of the most recent source check in the group. */
  lastVerified: string | null;
}

export const PROVIDER_GROUPS: { value: ProviderGroup; label: string }[] = [
  { value: "all", label: "Every provider we cover" },
  { value: "national", label: "National agencies (CHED, DOST-SEI, OWWA)" },
  { value: "lgu", label: "City & provincial governments" },
  { value: "university", label: "Universities & colleges" },
];

export function groupLabel(group: ProviderGroup): string {
  return PROVIDER_GROUPS.find((entry) => entry.value === group)?.label ?? "";
}

export function inGroup(card: SummarisableScholarship, group: ProviderGroup): boolean {
  return group === "all" || card.kind === group;
}

/**
 * Describe one slice of the data set. Amounts are reported as a range and never
 * summed: some programmes publish a figure per year and others per semester, so
 * a total would overstate what any student could receive.
 */
export function summariseSupport(
  cards: readonly SummarisableScholarship[],
  group: ProviderGroup
): SupportSummary {
  const slice = cards.filter((card) => inGroup(card, group));

  if (slice.length === 0) {
    return {
      group,
      count: 0,
      verifiedCount: 0,
      lowest: null,
      highest: null,
      soonestDeadlineIso: null,
      lastVerified: null,
    };
  }

  const amounts = slice.map((card) => card.amount);
  const deadlines = slice.map((card) => card.deadlineIso).sort();
  const checks = slice.map((card) => card.lastVerified).sort();

  return {
    group,
    count: slice.length,
    verifiedCount: slice.filter((card) => card.verification === "Verified").length,
    lowest: Math.min(...amounts),
    highest: Math.max(...amounts),
    soonestDeadlineIso: deadlines[0] ?? null,
    lastVerified: checks.at(-1) ?? null,
  };
}
