import { DATA, KIND } from "@/lib/scholarships";
import { daysBetween } from "./deadlines";

export type Decision = "yes" | "no" | undefined;

export interface Advice {
  id: string;
  title: string;
  text: string;
}

/**
 * Cross-scholarship advice shown during the deck and on the review screen.
 * Deterministic and data-driven — no model involved (AGENTS.md §3).
 */
export function advisory(decisions: Decision[]): Advice | null {
  const yes = decisions
    .map((v, i) => (v === "yes" ? i : -1))
    .filter((i) => i >= 0);
  const national = yes.filter((i) => KIND[i] === "national");

  if (national.length >= 2) {
    const names = national.slice(0, 2).map((i) => DATA[i].provider);
    return {
      id: "national",
      title: "Heads up on " + names.join(" and "),
      text:
        "These are both national government programs. Students generally cannot hold two at the same time, so you may be asked to choose one after an offer. Keeping both on your list is fine — apply and decide later.",
    };
  }

  if (yes.length >= 3) {
    return {
      id: "documents",
      title: "Three applications, one document set",
      text: "All three ask for a PSA birth certificate, grade records and proof of enrollment. Prepare one set and reuse it. Only the income documentation differs between providers.",
    };
  }

  if (yes.length >= 2) {
    /* Clustered application windows, decided by comparing the deadlines with
       each other — no dependency on today's date, so the advice is stable. */
    const byDate = yes
      .map((i) => DATA[i])
      .sort((a, b) => a.deadlineIso.localeCompare(b.deadlineIso));
    for (let i = 0; i < byDate.length - 1; i++) {
      const first = byDate[i];
      const second = byDate[i + 1];
      if (daysBetween(first.deadlineIso, second.deadlineIso) <= 14) {
        return {
          id: "deadlines",
          title: "Two deadlines land in the same fortnight",
          text:
            first.provider +
            " closes " +
            first.deadline +
            " and " +
            second.provider +
            " closes " +
            second.deadline +
            ". Start with the earlier one — the requirements overlap.",
        };
      }
    }
  }

  return null;
}

/** Throwaway helpers mirroring prototype intent, kept pure for tests. */
export function hasDecision(decisions: Decision[], value: "yes" | "no"): boolean {
  return decisions.includes(value);
}