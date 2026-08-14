import type { MatchTone4 } from "./matching";

/** Format an amount as Philippine pesos, e.g. 60000 -> ₱60,000. */
export function formatPeso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH");
}

export interface RequirementMetric {
  met: number;
  total: number;
  /**
   * `null` when the provider publishes nothing checkable.
   *
   * Not 0. A programme with no published criteria has not been failed, it has
   * not been measured, and printing 0% would read as a rejection the arithmetic
   * never made (AGENTS.md §3, spec §2.1). Callers must render the distinction
   * rather than coercing it to a number.
   */
  pct: number | null;
  tone: MatchTone4;
}

/**
 * Deterministic, explainable requirement metric (AGENTS.md §3).
 * The percentage is a plain ratio of structured met/total counts — never an
 * AI-generated confidence score. Warnings and unknown ("none") requirements
 * count as *not met* so the metric never overstates eligibility.
 */
export function requirementMetric(
  card: { met: number; total: number; tone: MatchTone4 }
): RequirementMetric {
  const total = Math.max(0, card.total);
  const met = Math.max(0, Math.min(card.met, total));
  return {
    met,
    total,
    pct: total === 0 ? null : Math.round((met / total) * 100),
    tone: card.tone,
  };
}

/** Constrain to [0, 1]. */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
