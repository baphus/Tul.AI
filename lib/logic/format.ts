import type { Scholarship } from "@/lib/scholarships";
import type { MatchTone } from "@/lib/scholarships";

/** Format an amount as Philippine pesos, e.g. 60000 -> ₱60,000. */
export function formatPeso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH");
}

export interface RequirementMetric {
  met: number;
  total: number;
  pct: number;
  tone: MatchTone;
}

/**
 * Deterministic, explainable requirement metric (AGENTS.md §3).
 * The percentage is a plain ratio of structured met/total counts — never an
 * AI-generated confidence score. Warnings and unknown ("none") requirements
 * count as *not met* so the metric never overstates eligibility.
 */
export function requirementMetric(card: Pick<Scholarship, "met" | "total" | "tone">): RequirementMetric {
  const total = Math.max(1, card.total);
  const met = Math.max(0, Math.min(card.met, total));
  const pct = Math.round((met / total) * 100);
  return { met, total, pct, tone: card.tone };
}

/** Constrain to [0, 1]. */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}