/**
 * The deterministic eligibility and ranking engine (PRD §16–19, AGENTS.md §6).
 *
 * The LLM is never the source of truth here: every check is arithmetic over the
 * structured `eligibility` criteria published on a scholarship and the fields a
 * student actually entered. A check resolves to exactly one of met, not-met or
 * unknown, and unknown is its own state — it is never collapsed into a failed
 * requirement (AGENTS.md §3). Tones come from the four PRD §19 buckets only, so
 * the UI can never surface a fabricated confidence score.
 */

import type { Scholarship } from "@/lib/scholarships";
import type { Profile } from "./state";

export type CheckState = "met" | "not-met" | "unknown";

export interface RequirementCheck {
  state: CheckState;
  label: string;
  detail: string;
}

/** The four PRD §19 buckets. `none` renders as "Not currently eligible". */
export type MatchTone4 = "strong" | "good" | "possible" | "none";

export interface RankedMatch {
  id: string;
  met: number;
  total: number;
  tone: MatchTone4;
  /** The plain-language bucket, e.g. "Strong match". */
  match: string;
  checks: RequirementCheck[];
}

export const TONE_LABEL: Record<MatchTone4, string> = {
  strong: "Strong match",
  good: "Good match",
  possible: "Possible match",
  none: "Not currently eligible",
};

/** Monthly-income bracket → a single peso figure for the ceiling comparison. */
const INCOME_MIDPOINT: Record<string, number> = {
  "Below ₱10,000": 5000,
  "₱10,000–₱20,000": 15000,
  "₱20,000–₱30,000": 25000,
  "₱30,000–₱50,000": 40000,
  "Above ₱50,000": 60000,
};

function gwaOf(profile: Profile): number | null {
  const raw = profile.gwa.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** `null` when the bracket is empty or "Prefer not to say" — both are unknown. */
function incomeOf(profile: Profile): number | null {
  return INCOME_MIDPOINT[profile.income] ?? null;
}

function sameField(list: string[], value: string): boolean {
  return list.some((entry) => entry.trim().toLowerCase() === value.trim().toLowerCase());
}

/**
 * Match one scholarship against a profile. The set of checks is exactly the set
 * of *published* criteria — a programme that publishes no GWA minimum never
 * gets a GWA check invented for it.
 */
export function matchScholarship(card: Scholarship, profile: Profile): RankedMatch {
  const checks: RequirementCheck[] = [];
  const el = card.eligibility;

  if (el.gwaMin !== undefined) {
    const gwa = gwaOf(profile);
    const met = gwa !== null && gwa >= el.gwaMin;
    checks.push({
      label: "GWA",
      state: gwa === null ? "unknown" : met ? "met" : "not-met",
      detail:
        gwa === null
          ? `No GWA on your profile — cannot confirm the ${el.gwaMin}% minimum.`
          : met
            ? `Your ${gwa}% meets the published ${el.gwaMin}% minimum.`
            : `Your ${gwa}% is below the published ${el.gwaMin}% minimum.`,
    });
  }

  if (el.courses && el.courses.length > 0) {
    const course = profile.course.trim();
    const listed = sameField(el.courses, course);
    checks.push({
      label: "Course",
      state: listed ? "met" : !course || el.courseMode === "priority" ? "unknown" : "not-met",
      detail: listed
        ? `${course} is on the published eligible list.`
        : !course
          ? "No course on your profile — cannot confirm the eligible list."
          : el.courseMode === "priority"
            ? `${course} is not on this cycle's priority list, but the office may still accept general applicants.`
            : `${course} is not on the published eligible list.`,
    });
  }

  if (el.years && el.years.length > 0) {
    const year = profile.year.trim();
    const listed = el.years.includes(year);
    checks.push({
      label: "Year level",
      state: !year ? "unknown" : listed ? "met" : "not-met",
      detail: !year
        ? "No year level on your profile — cannot confirm which cycles accept you."
        : listed
          ? `${year} is accepted for this cycle.`
          : `${year} is not accepted for this cycle.`,
    });
  }

  if (el.stages && el.stages.length > 0) {
    const stage = profile.stage.trim();
    const listed = el.stages.includes(stage);
    checks.push({
      label: "Student status",
      state: !stage ? "unknown" : listed ? "met" : "not-met",
      detail: !stage
        ? "No student status on your profile — cannot confirm the accepted group."
        : listed
          ? `${stage} is within the published group.`
          : `${stage} is outside the published group.`,
    });
  }

  if (el.locations && el.locations.length > 0) {
    const city = profile.city.trim();
    const listed = el.locations.includes(city);
    checks.push({
      label: "Location",
      state: !city ? "unknown" : listed ? "met" : "not-met",
      detail: !city
        ? "No location on your profile — cannot confirm the residency requirement."
        : listed
          ? `${city} satisfies the residency requirement.`
          : `This programme is limited to ${el.locations.join(" or ")}.`,
    });
  }

  if (el.incomeMax !== undefined) {
    const income = incomeOf(profile);
    const ceiling = `₱${el.incomeMax.toLocaleString("en-PH")}`;
    checks.push({
      label: "Household income",
      state: income === null ? "unknown" : income <= el.incomeMax ? "met" : "not-met",
      detail:
        income === null
          ? `No income bracket on your profile — cannot confirm the published ${ceiling} ceiling.`
          : income <= el.incomeMax
            ? `Your income bracket sits within the published ${ceiling} ceiling.`
            : `Your income bracket exceeds the published ${ceiling} ceiling.`,
    });
  }

  if (el.school) {
    const school = profile.school.trim();
    checks.push({
      label: "School",
      state: !school ? "unknown" : school === el.school ? "met" : "not-met",
      detail: !school
        ? "No school on your profile — cannot confirm where you are enrolled."
        : school === el.school
          ? `${school} is the granting university.`
          : `This grant is for students enrolled at ${el.school}.`,
    });
  }

  if (el.special && el.special.length > 0) {
    const special = el.special;
    const picked = profile.chips;
    const matched = picked.filter((chip) => special.includes(chip));
    const withheld = picked.includes("Prefer not to say") || picked.length === 0;
    checks.push({
      label: "Special circumstances",
      state: matched.length > 0 ? "met" : withheld ? "unknown" : "not-met",
      detail:
        matched.length > 0
          ? `You indicated ${matched.join(" and ")} — this programme is for you.`
          : withheld
            ? "No circumstances on your profile — this requirement stays unknown."
            : `This programme is for ${special.join(" or ")} households.`,
    });
  }

  const total = checks.length;
  const met = checks.filter((check) => check.state === "met").length;
  const tone = toneFor(checks, met, total);

  return { id: card.id, met, total, tone, match: TONE_LABEL[tone], checks };
}

/**
 * Bucket into the four PRD §19 categories. A single hard conflict puts the
 * programme in `none` regardless of the count; `strong` is reserved for cases
 * where every published requirement is confirmed met, so an outstanding unknown
 * can never masquerade as a strong match. The bucketed words are the only score
 * the UI may show, so the arithmetic here has to stay this explicit.
 */
function toneFor(checks: RequirementCheck[], met: number, total: number): MatchTone4 {
  if (checks.some((check) => check.state === "not-met")) return "none";
  if (total === 0) return "possible";
  if (met === total) return "strong";
  if (met / total >= 0.5) return "good";
  return "possible";
}

/**
 * Rank every scholarship for a profile. Order is deterministic:
 *   1. hard conflicts (Not currently eligible) sink to the bottom
 *   2. eligibility compatibility — share of published requirements met
 *   3. deadline — the soonest first, since a closed window ends a match
 *   4. amount — financial relevance breaks any remaining tie
 * This is a stable ordering of structured arithmetic, never a model score
 * (PRD §19, AGENTS.md §6).
 */
export function rankScholarships(cards: Scholarship[], profile: Profile): RankedMatch[] {
  return cards
    .map((card) => ({ card, result: matchScholarship(card, profile) }))
    .sort((a, b) => compare(a.result, a.card, b.result, b.card))
    .map(({ result }) => result);
}

function compare(
  a: RankedMatch,
  aCard: Scholarship,
  b: RankedMatch,
  bCard: Scholarship
): number {
  const aOpen = a.tone === "none" ? 0 : 1;
  const bOpen = b.tone === "none" ? 0 : 1;
  if (aOpen !== bOpen) return bOpen - aOpen;

  /* A hard-conflicted programme has zero eligibility compatibility; the ratio
     below it is meaningless, so the whole group sorts by deadline then amount. */
  const aRatio = a.tone === "none" || a.total === 0 ? 0 : a.met / a.total;
  const bRatio = b.tone === "none" || b.total === 0 ? 0 : b.met / b.total;
  if (aRatio !== bRatio) return bRatio - aRatio;

  const byDeadline = aCard.deadlineIso.localeCompare(bCard.deadlineIso);
  if (byDeadline !== 0) return byDeadline;

  return bCard.amount - aCard.amount;
}

export interface MatchCounts {
  /** Programme count in the data set. */
  reviewed: number;
  /** Those with no hard conflict — worth a look. */
  relevant: number;
  /** Those in the top bucket. */
  strong: number;
}

/** Summary figures for the research moment, read off a ranked list. */
export function countsOf(ranked: RankedMatch[]): MatchCounts {
  const relevant = ranked.filter((result) => result.tone !== "none").length;
  const strong = ranked.filter((result) => result.tone === "strong").length;
  return { reviewed: ranked.length, relevant, strong };
}
