import type { MatchTone4 } from "./matching";

/** Format an amount as Philippine pesos, e.g. 60000 -> ₱60,000. */
export function formatPeso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH");
}

/** Uses published non-cash benefits when no positive peso amount was parsed. */
export function benefitSummary(card: { amount: number; benefits: string[] }): string {
  if (card.amount > 0) return formatPeso(card.amount);
  const benefits = card.benefits
    .filter((benefit) => !/^₱\s*0(?:\D|$)/i.test(benefit.trim()))
    .filter(Boolean);
  if (!benefits.length) return "See provider details";

  const compact = benefits.map((benefit) =>
    benefit
      .replace(/^Full tuition and training fees$/i, "Full tuition + training")
      .replace(/^Stay-in accommodation for (\d+) months$/i, "$1-month accommodation")
      .replace(/^Transportation allowance$/i, "Transport allowance")
      .replace(/^School supplies and uniforms$/i, "Supplies + uniforms")
      .replace(/\band\b/gi, "+")
  );
  const visible = compact.slice(0, 3).join(" · ");
  const remaining = compact.length - 3;
  return remaining > 0 ? `${visible} · +${remaining} more benefits` : visible;
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
