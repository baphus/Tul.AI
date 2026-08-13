import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import { matchScholarship } from "./matching";
import {
  PASS_COUNT,
  PASS_LABELS,
  SCOPED_LABELS,
  matchAll,
  runMatchPasses,
  tallyPass,
  totalsOf,
} from "./match-passes";
import { emptyProfile, type Profile } from "./state";

const DEMO: Profile = {
  ...emptyProfile(),
  city: "Cebu City",
  stage: "College Student",
  course: "BS Information Systems",
  year: "1st Year",
  gwaBand: "90–94",
};

describe("the pass partition", () => {
  it("has a label for every pass", () => {
    expect(PASS_LABELS).toHaveLength(PASS_COUNT);
  });

  it("covers every requirement label the engine can emit", () => {
    // If the engine gains a new check and no pass claims it, the research
    // sequence would silently stop counting it. This is the guard.
    const emitted = new Set(
      DATA.flatMap((card) => matchScholarship(card, DEMO).checks.map((c) => c.label))
    );
    for (const label of emitted) {
      expect(SCOPED_LABELS).toContain(label);
    }
  });

  it("assigns each label to exactly one pass", () => {
    expect(new Set(SCOPED_LABELS).size).toBe(SCOPED_LABELS.length);
  });
});

describe("tallyPass", () => {
  const pairs = matchAll(DATA, DEMO);

  it("counts every requirement exactly once across passes 2–5", () => {
    const scoped = [1, 2, 3, 4].map((i) => tallyPass(i, pairs));
    const summed = scoped.reduce(
      (acc, p) => ({
        met: acc.met + p.met,
        unknown: acc.unknown + p.unknown,
        conflicts: acc.conflicts + p.conflicts,
      }),
      { met: 0, unknown: 0, conflicts: 0 }
    );

    const opening = tallyPass(0, pairs);
    expect(summed).toEqual({
      met: opening.met,
      unknown: opening.unknown,
      conflicts: opening.conflicts,
    });
  });

  it("reconciles with the engine's own per-record totals", () => {
    const opening = tallyPass(0, pairs);
    const requirements = pairs.reduce((sum, { result }) => sum + result.total, 0);
    expect(opening.met + opening.unknown + opening.conflicts).toBe(requirements);
  });

  it("throws on a pass that does not exist rather than reporting zero", () => {
    expect(() => tallyPass(PASS_COUNT, pairs)).toThrow();
  });
});

describe("totalsOf", () => {
  const pairs = matchAll(DATA, DEMO);

  it("reviews every record in the data set", () => {
    expect(totalsOf(pairs).reviewed).toBe(DATA.length);
  });

  it("never reports more open records than records", () => {
    const totals = totalsOf(pairs);
    expect(totals.open).toBeLessThanOrEqual(totals.reviewed);
  });

  it("counts unknowns that the engine also counted", () => {
    const totals = totalsOf(pairs);
    const unknown = pairs.reduce((sum, { result }) => sum + result.unknown, 0);
    expect(totals.unknown).toBe(unknown);
  });
});

describe("runMatchPasses", () => {
  it("ranks every record, in the engine's own order", () => {
    const run = runMatchPasses(DATA, DEMO);
    expect(run.ranked).toHaveLength(DATA.length);
    expect(new Set(run.ranked.map((r) => r.id)).size).toBe(DATA.length);
  });

  it("produces one result per pass", () => {
    expect(runMatchPasses(DATA, DEMO).passes).toHaveLength(PASS_COUNT);
  });

  it("is pure — the same inputs give the same figures", () => {
    const a = runMatchPasses(DATA, DEMO);
    const b = runMatchPasses(DATA, DEMO);
    expect(a.passes).toEqual(b.passes);
    expect(a.totals).toEqual(b.totals);
    expect(a.ranked.map((r) => r.id)).toEqual(b.ranked.map((r) => r.id));
  });

  it("finds no conflict at all for an empty profile", () => {
    // The sequence must never open by telling a student with no answers that
    // they have failed something (AGENTS.md §3).
    const run = runMatchPasses(DATA, emptyProfile());
    expect(run.passes.every((pass) => pass.conflicts === 0)).toBe(true);
    expect(run.totals.open).toBe(DATA.length);
  });
});
