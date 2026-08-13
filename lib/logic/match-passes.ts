/**
 * The research moment, as actual work (PRD §14, spec §3.5).
 *
 * What this replaces: five `setTimeout` calls at a fixed 760 ms, plus a 900 ms
 * fallback in case they didn't fire. Those ticks were decorative — they could not
 * desynchronise from the arithmetic because they were never connected to it, and
 * the counts beside them appeared on a timer rather than when they were known.
 *
 * Here, pass 1 runs the engine over every record and passes 2–5 tally their own
 * slice of the resulting checks. Every number the sequence displays is a number
 * the deck will agree with, because both read the same `matchScholarship` output.
 * A student could verify any of them by opening the records themselves, which is
 * the point of AGENTS.md §3.
 *
 * Honest about what it is: the passes are groupings over checks the engine
 * already performs, not five separate engines, and not network calls. The caller
 * paces the reveal for legibility — see `MIN_PASS_MS` in matching-run.tsx — but
 * it cannot fabricate a figure, and it cannot finish before the work does.
 */

import type { Scholarship } from "@/lib/scholarships";
import {
  matchScholarship,
  sortMatches,
  type RankedMatch,
  type RequirementCheck,
} from "./matching";
import type { Profile } from "./state";

export interface MatchPair {
  card: Scholarship;
  result: RankedMatch;
}

export interface PassResult {
  /** What the student sees on this line. */
  label: string;
  /** Requirements this pass resolved to met. */
  met: number;
  /** Requirements this pass could not resolve either way. */
  unknown: number;
  /** Requirements this pass found in genuine conflict. */
  conflicts: number;
}

/**
 * The requirement labels each pass owns.
 *
 * `null` means "every requirement" — the opening pass, which is the one that
 * actually runs the engine. The rest partition the labels between them, so no
 * requirement is counted twice and none is missed; `match-passes.test.ts`
 * asserts exactly that against the engine's own label set.
 */
const PASSES: { label: string; labels: string[] | null }[] = [
  { label: "Reading your profile against every record", labels: null },
  {
    label: "Checking academic requirements",
    labels: ["GWA", "Course", "Year level", "Student status"],
  },
  { label: "Comparing financial-aid criteria", labels: ["Household income"] },
  {
    label: "Checking location and school requirements",
    labels: ["Location", "School"],
  },
  {
    label: "Looking for programmes you may have missed",
    labels: ["Special circumstances"],
  },
];

export const PASS_COUNT = PASSES.length;

export const PASS_LABELS: string[] = PASSES.map((pass) => pass.label);

/** Every requirement label the passes 2–5 divide between them. */
export const SCOPED_LABELS: string[] = PASSES.slice(1).flatMap(
  (pass) => pass.labels ?? []
);

/**
 * Pass 1: run the deterministic engine over every record.
 *
 * This is the real work, and it is the only place the engine is called — the
 * remaining passes read its output rather than recomputing it, so no pass can
 * disagree with another about a single check.
 */
export function matchAll(cards: Scholarship[], profile: Profile): MatchPair[] {
  return cards.map((card) => ({ card, result: matchScholarship(card, profile) }));
}

function scopeOf(checks: RequirementCheck[], labels: string[] | null) {
  return labels === null ? checks : checks.filter((check) => labels.includes(check.label));
}

/** Tally one pass across every record. Pure, and cheap enough to call per frame. */
export function tallyPass(index: number, pairs: MatchPair[]): PassResult {
  const pass = PASSES[index];
  if (!pass) throw new Error(`No match pass at index ${index}`);

  let met = 0;
  let unknown = 0;
  let conflicts = 0;

  for (const { result } of pairs) {
    for (const check of scopeOf(result.checks, pass.labels)) {
      if (check.state === "met") met++;
      else if (check.state === "unknown") unknown++;
      else conflicts++;
    }
  }

  return { label: pass.label, met, unknown, conflicts };
}

/** The engine's ordering, applied to an already-matched set. */
export function rankPairs(pairs: MatchPair[]): RankedMatch[] {
  return sortMatches(pairs);
}

export interface RunTotals {
  /** Records in the data set. */
  reviewed: number;
  /** Published requirements compared across every record. */
  requirements: number;
  /** Requirements that could not be resolved either way. */
  unknown: number;
  /** Records with no hard conflict — worth a look. */
  open: number;
}

/** The summary figures under the pass list. */
export function totalsOf(pairs: MatchPair[]): RunTotals {
  return {
    reviewed: pairs.length,
    requirements: pairs.reduce((sum, { result }) => sum + result.total, 0),
    unknown: pairs.reduce((sum, { result }) => sum + result.unknown, 0),
    open: pairs.filter(({ result }) => result.tone !== "none").length,
  };
}

/** Everything at once, for tests and for a caller that doesn't animate. */
export function runMatchPasses(
  cards: Scholarship[],
  profile: Profile
): { ranked: RankedMatch[]; passes: PassResult[]; totals: RunTotals } {
  const pairs = matchAll(cards, profile);
  return {
    ranked: rankPairs(pairs),
    passes: PASSES.map((_, i) => tallyPass(i, pairs)),
    totals: totalsOf(pairs),
  };
}
