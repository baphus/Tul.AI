import type { Profile } from "@/lib/logic/state";
import { ONBOARDING_STEPS } from "@/lib/logic/routes";
import { PLANNING } from "@/lib/scholarships";

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

/** Whether this student has committed to studying somewhere yet. */
export function isPlanning(profile: Profile): boolean {
  return profile.stage.trim() === PLANNING;
}

/**
 * Whether a student can move on from an onboarding step.
 *
 * The six steps are: journey, location, studies, academic standing, household,
 * free text (spec §3.3). Study stage and citizenship gate the first step;
 * location and course gate the next two. Money, circumstances and academic
 * standing are optional by design: a blank answer becomes an *unknown*
 * requirement later, never a failed one (AGENTS.md §3).
 *
 * A student still planning where to study is never asked for a school, so step 3
 * asks them only for a course.
 */
export function canAdvance(step: number, profile: Profile): boolean {
  switch (step) {
    case 1:
      return profile.stage.trim() !== "" && profile.citizenship.trim() !== "";
    case 2:
      return profile.city.trim() !== "";
    case 3:
      return profile.course.trim() !== "";
    case 4:
      return !gwaError(profile.gwa);
    case 5:
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

/** The appropriate question to reopen when matching lacks required answers. */
export function matchingRecoveryStep(profile: Profile): number {
  return firstIncompleteStep(profile);
}

/** Enough of a profile to run matching at all. */
export function isProfileReady(profile: Profile): boolean {
  // Matching requires the student's citizenship, location and course. Other
  // unanswered requirements remain Unknown, never Not Met.
  return profile.citizenship.trim() !== "" && profile.city.trim() !== "" && profile.course.trim() !== "";
}

/**
 * How much of the profile is filled in — drives the completeness meter.
 *
 * A band and its exact counterpart count once between them: a student who
 * answered the band has answered the question, and showing them an unfilled
 * segment for declining to give an exact figure would push disclosure the
 * privacy model does not want (AGENTS.md §9).
 */
export function profileCompleteness(profile: Profile): { filled: number; total: number } {
  const fields = [
    profile.city,
    profile.citizenship,
    profile.course,
    profile.school,
    profile.stage,
    profile.year,
    profile.gwaBand || profile.gwa,
    profile.income,
    profile.householdBand || profile.dependents,
    profile.chips.length > 0 ? "x" : "",
    profile.notes,
  ];
  return { filled: fields.filter((f) => f.trim() !== "").length, total: fields.length };
}
