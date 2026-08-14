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

import { GWA_BANDS, bandByValue, upperExclusive } from "@/lib/reference/bands";
import { CHIP_NONE, PLANNING, type Scholarship } from "@/lib/scholarships";
import { provinceOf } from "@/lib/reference/locations";
import { matchCohort, matchCourse } from "./normalize";
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
  /** Requirements that could not be resolved either way. */
  unknown: number;
  tone: MatchTone4;
  /**
   * Share of published requirements confirmed met, 0–100.
   *
   * `null` — not 0 — when the provider publishes nothing checkable, because a
   * programme with no published criteria has not been failed, it has simply not
   * been measured. Rendering 0% there would read as a rejection the arithmetic
   * never made (AGENTS.md §3, spec §2.1).
   */
  percent: number | null;
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

/**
 * The interval a profile's GWA answer describes: a degenerate point when they
 * gave an exact figure, a half-open interval when they picked a band, `null` when
 * they did neither.
 *
 * `highExclusive` rather than an inclusive upper bound because a band labelled
 * "90–94" holds every mark below 95, fractions included — see the note on `Band`.
 * The exact figure wins where both exist, because a point can settle a comparison
 * a band can only straddle (see `gwaCheck`).
 */
export function gwaBounds(
  profile: Profile
): { low: number; highExclusive: number } | null {
  const exact = gwaOf(profile);
  if (exact !== null) return { low: exact, highExclusive: exact };
  const band = bandByValue(GWA_BANDS, profile.gwaBand);
  return band ? { low: band.low, highExclusive: upperExclusive(band) } : null;
}

/** `null` when the bracket is empty or "Prefer not to say" — both are unknown. */
function incomeOf(profile: Profile): number | null {
  return INCOME_MIDPOINT[profile.income] ?? null;
}

/**
 * Match one scholarship against a profile. The set of checks is exactly the set
 * of *published* criteria — a programme that publishes no GWA minimum never
 * gets a GWA check invented for it.
 */
export function matchScholarship(card: Scholarship, profile: Profile): RankedMatch {
  const checks: RequirementCheck[] = [];
  const el = card.eligibility;

  if (el.citizenship && el.citizenship.length > 0) {
    checks.push(citizenshipCheck(el.citizenship, profile));
  }

  if (el.gwaMin !== undefined) {
    checks.push(gwaCheck(el.gwaMin, profile));
  }

  if (el.courses && el.courses.length > 0) {
    const course = profile.course.trim();
    const verdict = matchCourse(el.courses, course);
    checks.push({
      label: "Course",
      state: verdict.state,
      detail: verdict.openToAny
        ? course
          ? "This programme is open to any undergraduate course, so your course qualifies."
          : "This programme is open to any undergraduate course — add yours and we'll confirm it."
        : verdict.state === "met"
          ? `${course} matches the published entry “${verdict.matched}”.`
          : verdict.state === "unknown"
            ? course
              ? `${course} is not named on this cycle's list, but the list is a priority or partial one — the office may still accept you.`
              : "No course on your profile — cannot confirm the eligible list."
            : `${course} is not on the published eligible list.`,
    });
  }

  if (el.years && el.years.length > 0) {
    const verdict = matchCohort(el.years, profile.stage, profile.year);
    const where = describeCohort(profile);
    checks.push({
      label: "Year level",
      state: verdict.state,
      detail:
        verdict.state === "met"
          ? `${where} is accepted for this cycle — published as “${verdict.matched}”.`
          : verdict.state === "unknown"
            ? where === null
              ? "Nothing on your profile places you in a year level yet — cannot confirm which cycles accept you."
              : `The published year levels don't resolve to a clear cohort, so this stays unknown rather than counting against you.`
            : `${where} is outside the published year levels for this cycle.`,
    });
  }

  if (el.stages && el.stages.length > 0) {
    const stage = profile.stage.trim();
    const placeable = stage !== "" && stage !== PLANNING;
    const listed = el.stages.includes(stage);
    checks.push({
      label: "Student status",
      state: !placeable ? "unknown" : listed ? "met" : "not-met",
      detail: !stage
        ? "No student status on your profile — cannot confirm the accepted group."
        : stage === PLANNING
          ? "You're still planning where to study, so this requirement stays unknown."
          : listed
            ? `${stage} is within the published group.`
            : `${stage} is outside the published group.`,
    });
  }

  if (el.locations && el.locations.length > 0) {
    const city = profile.city.trim();
    const location = matchLocation(el.locations, city);
    checks.push({
      label: "Location",
      state: location.state,
      detail: !city
        ? "No location on your profile — cannot confirm the residency requirement."
        : location.state === "met"
          ? `${city} satisfies the published ${location.matched} location scope.`
          : location.state === "unknown"
            ? `We cannot safely compare ${city} with the provider's published location scope, so this stays unknown.`
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
    const same = school.toLowerCase() === el.school.trim().toLowerCase();
    checks.push({
      label: "School",
      state: !school ? "unknown" : same ? "met" : "not-met",
      detail: !school
        ? "No school on your profile — cannot confirm where you are enrolled."
        : same
          ? `${school} is the granting university.`
          : `This grant is for students enrolled at ${el.school}.`,
    });
  }

  if (el.special && el.special.length > 0) {
    checks.push(specialCheck(el.special, profile));
  }

  const total = checks.length;
  const met = checks.filter((check) => check.state === "met").length;
  const unknown = checks.filter((check) => check.state === "unknown").length;
  const tone = toneFor(checks, met, total);

  return {
    id: card.id,
    met,
    total,
    unknown,
    tone,
    percent: total === 0 ? null : Math.round((met / total) * 100),
    match: TONE_LABEL[tone],
    checks,
  };
}

/**
 * Compare the onboarding location with a provider's geographic scope. National
 * programmes publish "Philippines" while onboarding records a city or province;
 * city-to-province matching is similarly necessary for "Cebu Province". A free
 * text location that cannot be placed is Unknown, never a false rejection.
 */
export function matchLocation(
  published: string[],
  location: string
): { state: CheckState; matched: string | null } {
  const mine = location.trim();
  if (!mine) return { state: "unknown", matched: null };

  const exact = published.find((entry) => entry.trim().toLowerCase() === mine.toLowerCase());
  if (exact) return { state: "met", matched: exact };

  const nationwide = published.find((entry) => /^(philippines|nationwide)$/i.test(entry.trim()));
  if (nationwide) return { state: "met", matched: nationwide };

  const province = provinceOf(mine);
  if (!province) return { state: "unknown", matched: null };

  const provinceMatch = published.find((entry) => {
    const normalized = entry.trim().replace(/\s+province$/i, "").toLowerCase();
    return normalized === province.toLowerCase();
  });
  if (provinceMatch) return { state: "met", matched: provinceMatch };

  return { state: "not-met", matched: null };
}

function citizenshipCheck(accepted: string[], profile: Profile): RequirementCheck {
  const citizenship = profile.citizenship.trim();
  if (!citizenship || citizenship === "Prefer not to say") {
    return {
      label: "Citizenship",
      state: "unknown",
      detail: `No citizenship confirmation on your profile — cannot confirm the published ${accepted.join(" or ")} requirement.`,
    };
  }

  const matched = accepted.some((value) => value.trim().toLowerCase() === citizenship.toLowerCase());
  return {
    label: "Citizenship",
    state: matched ? "met" : "not-met",
    detail: matched
      ? `You confirmed ${citizenship}, which meets the published requirement.`
      : `This programme is limited to ${accepted.join(" or ")} citizens.`,
  };
}

/**
 * A GWA answer against a published minimum.
 *
 * An exact figure is a point and settles the comparison. A band is an interval,
 * and an interval that *straddles* the minimum settles nothing: a student in the
 * 90–94 band facing a 92% cut-off may or may not clear it, and calling that Not
 * Met would fail them on evidence we do not have (AGENTS.md §3, spec §2.2). So
 * the straddle resolves Unknown, and the detail names the exact-GWA field as the
 * way to resolve it — which is the whole reason that optional input still exists.
 */
function gwaCheck(gwaMin: number, profile: Profile): RequirementCheck {
  const bounds = gwaBounds(profile);
  if (bounds === null) {
    return {
      label: "GWA",
      state: "unknown",
      detail: `No GWA on your profile — cannot confirm the ${gwaMin}% minimum.`,
    };
  }

  const exact = bounds.low === bounds.highExclusive;
  const shown = exact ? `${bounds.low}%` : `${profile.gwaBand} band`;

  if (bounds.low >= gwaMin) {
    return {
      label: "GWA",
      state: "met",
      detail: `Your ${shown} ${exact ? "meets" : "clears"} the published ${gwaMin}% minimum.`,
    };
  }

  /* Every mark the answer could represent falls short. For a band this is the
     exclusive upper bound, so "90–94" against a 95% minimum is a genuine miss
     while the same band against 94% is not. */
  if (bounds.highExclusive <= gwaMin) {
    return {
      label: "GWA",
      state: "not-met",
      detail: `Your ${shown} is below the published ${gwaMin}% minimum.`,
    };
  }

  return {
    label: "GWA",
    state: "unknown",
    detail: `Your ${profile.gwaBand} band straddles the published ${gwaMin}% minimum — add your exact GWA to resolve it.`,
  };
}

/**
 * Special-circumstance categories against what a student disclosed.
 *
 * Three distinct answers, and conflating any two of them would be a §3 failure
 * (spec §2.3):
 *
 *   - a matching circumstance          → met
 *   - "None of these apply"            → not-met. The student told us something.
 *   - "Prefer not to say", or nothing  → unknown. We have no evidence either way.
 *
 * The middle case is the one worth being careful about. It is honest — a
 * 4Ps-only programme genuinely does not fit a student who says no listed
 * circumstance applies — and it is only reachable because the chip is exclusive,
 * so "None" can never sit alongside a disclosed circumstance.
 */
function specialCheck(special: string[], profile: Profile): RequirementCheck {
  const picked = profile.chips;
  const matched = picked.filter((chip) => special.includes(chip));

  if (matched.length > 0) {
    return {
      label: "Special circumstances",
      state: "met",
      detail: `You indicated ${matched.join(" and ")} — this programme is for you.`,
    };
  }

  if (picked.includes(CHIP_NONE)) {
    return {
      label: "Special circumstances",
      state: "not-met",
      detail: `You told us none of the listed circumstances apply, and this programme is for ${special.slice(0, 3).join(" or ")} applicants.`,
    };
  }

  /* "Prefer not to say", or no answer at all. */
  return {
    label: "Special circumstances",
    state: "unknown",
    detail: "No circumstances on your profile — this requirement stays unknown.",
  };
}

/** How to name the student's cohort in a requirement detail. */
function describeCohort(profile: Profile): string | null {
  const stage = profile.stage.trim();
  const year = profile.year.trim();
  if (!stage || stage === PLANNING) return null;
  if (stage === "College Student" && year) return `${year} (${stage.toLowerCase()})`;
  return stage;
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
  return sortMatches(cards.map((card) => ({ card, result: matchScholarship(card, profile) })));
}

/**
 * Order already-computed results. Exported so a caller that needs the raw checks
 * as well as the ranking (the research passes) can reuse this exact ordering
 * rather than keeping a second copy of it that could drift.
 */
export function sortMatches(
  pairs: { card: Scholarship; result: RankedMatch }[]
): RankedMatch[] {
  return pairs
    .slice()
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
