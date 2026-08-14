import type { RequirementRow } from "@/lib/scholarships";

import type { RankedMatch } from "./matching";

/**
 * Presentation projection for a personalized detail view.
 *
 * The deterministic matcher owns the verdict and explanation. Detail surfaces
 * only translate those results into their existing requirement-row UI shape so
 * they cannot fall back to the record's pre-profile placeholder rows.
 */
export function detailRequirements(result: RankedMatch): RequirementRow[] {
  return result.checks.map((check) => ({
    label: check.label,
    text: check.detail,
    state:
      check.state === "met" ? "ok" : check.state === "not-met" ? "warn" : "none",
  }));
}
