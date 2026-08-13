import type { Profile } from "@/lib/logic/state";
import { ONBOARDING_STEPS } from "@/lib/logic/routes";

/** Empty GWA is allowed (unknown); a filled GWA must be a number in [60, 100]. */
export function gwaError(gwa: string): boolean {
  const trimmed = gwa.trim();
  if (!trimmed) return false;
  const n = Number(trimmed);
  return Number.isNaN(n) || n < 60 || n > 100;
}

/** Empty is allowed; a filled dependant count must be a whole number 0–20. */
export function dependentsError(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const n = Number(trimmed);
  return !Number.isInteger(n) || n < 0 || n > 20;
}

/**
 * Whether a student can move on from an onboarding step.
 *
 * Only the two questions that materially change which scholarships can be
 * matched at all — where they study and what they study — are required. Money
 * and circumstances are optional by design: a blank answer becomes an *unknown*
 * requirement later, never a failed one (AGENTS.md §3).
 */
export function canAdvance(step: number, profile: Profile): boolean {
  switch (step) {
    case 1:
      return profile.city.trim() !== "";
    case 2:
      return profile.course.trim() !== "";
    case 3:
      return profile.stage.trim() !== "" && !gwaError(profile.gwa);
    case 4:
      return !dependentsError(profile.dependents);
    default:
      return true;
  }
}

/** The first step a student still has to answer, for resuming onboarding. */
export function firstIncompleteStep(profile: Profile): number {
  for (let step = 1; step <= ONBOARDING_STEPS; step++) {
    if (!canAdvance(step, profile)) return step;
  }
  return ONBOARDING_STEPS;
}

/** Enough of a profile to run matching at all. */
export function isProfileReady(profile: Profile): boolean {
  return canAdvance(1, profile) && canAdvance(2, profile) && canAdvance(3, profile);
}

/** How much of the profile is filled in — drives the completeness meter. */
export function profileCompleteness(profile: Profile): { filled: number; total: number } {
  const fields = [
    profile.city,
    profile.course,
    profile.school,
    profile.stage,
    profile.year,
    profile.gwa,
    profile.income,
    profile.dependents,
    profile.chips.length > 0 ? "x" : "",
    profile.notes,
  ];
  return { filled: fields.filter((f) => f.trim() !== "").length, total: fields.length };
}
