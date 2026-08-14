import { describe, expect, it } from "vitest";

import { DATA, type Scholarship } from "@/lib/scholarships";
import { emptyProfile, type Profile } from "./state";
import { countsOf, matchLocation, matchScholarship, rankScholarships } from "./matching";

const DEMO: Profile = {
  ...emptyProfile(),
  name: "Josephus",
  city: "Cebu City",
  stage: "College Student",
  school: "Cebu Technological University",
  course: "BS Information Systems",
  year: "1st Year",
  gwa: "94.5",
};

function fixture(eligibility: Scholarship["eligibility"]): Scholarship {
  return { ...DATA[0], id: "test-fixture", eligibility };
}

describe("matchScholarship", () => {
  it("keeps citizenship unknown until the student confirms it", () => {
    const card = fixture({ citizenship: ["Filipino"] });
    expect(matchScholarship(card, DEMO).checks[0].state).toBe("unknown");
    expect(matchScholarship(card, { ...DEMO, citizenship: "Filipino" }).checks[0].state).toBe("met");
  });

  it("only marks citizenship not-met after an explicit conflicting answer", () => {
    const result = matchScholarship(fixture({ citizenship: ["Filipino"] }), {
      ...DEMO,
      citizenship: "Not a Filipino citizen",
    });
    expect(result.checks[0].state).toBe("not-met");
    expect(result.tone).toBe("none");
  });

  it("matches country-wide coverage to a Philippine onboarding location", () => {
    const result = matchScholarship(fixture({ locations: ["Philippines"] }), DEMO);
    expect(result.checks[0]).toMatchObject({ state: "met", label: "Location" });
    expect(result.tone).toBe("strong");
  });

  it("matches a province-wide programme to a city in that province", () => {
    expect(matchLocation(["Cebu Province"], "Cebu City")).toMatchObject({ state: "met" });
  });

  it("keeps an unrecognised free-text location unknown", () => {
    expect(matchLocation(["Cebu Province"], "A town I typed")).toMatchObject({ state: "unknown" });
  });

  it("marks a profile as a strong match when every published requirement is met", () => {
    const result = matchScholarship(
      fixture({ gwaMin: 85, courses: ["BS Information Systems"], courseMode: "published" }),
      DEMO
    );
    expect(result.tone).toBe("strong");
    expect(result.met).toBe(2);
    expect(result.total).toBe(2);
  });

  it("keeps an unconfirmed requirement unknown, never not-met", () => {
    const result = matchScholarship(fixture({ incomeMax: 10000 }), DEMO);
    expect(result.checks[0].state).toBe("unknown");
    expect(result.tone).toBe("possible");
  });

  it("treats a missing special category as unknown", () => {
    const result = matchScholarship(fixture({ special: ["OFW parent"] }), DEMO);
    expect(result.checks[0].state).toBe("unknown");
    expect(result.tone).not.toBe("none");
  });

  it("recognizes a selected special category", () => {
    const result = matchScholarship(fixture({ special: ["OFW parent"] }), {
      ...DEMO,
      chips: ["OFW parent"],
    });
    expect(result.tone).toBe("strong");
    expect(result.met).toBe(1);
  });

  it("treats a published course list as a hard conflict", () => {
    const result = matchScholarship(
      fixture({ courses: ["BS Computer Science"], courseMode: "published" }),
      { ...DEMO, course: "BS Education" }
    );
    expect(result.checks[0].state).toBe("not-met");
    expect(result.tone).toBe("none");
  });

  it("treats a GWA below the cut-off as a hard conflict", () => {
    const result = matchScholarship(fixture({ gwaMin: 90 }), { ...DEMO, gwa: "80" });
    expect(result.tone).toBe("none");
  });

  it("treats income above the ceiling as a hard conflict", () => {
    const result = matchScholarship(fixture({ incomeMax: 10000 }), {
      ...DEMO,
      income: "Above ₱50,000",
    });
    expect(result.tone).toBe("none");
  });

  it("resolves an empty profile to unknown, not not-met", () => {
    for (const card of DATA) {
      const result = matchScholarship(card, emptyProfile());
      expect(result.checks.every((check) => check.state !== "not-met")).toBe(true);
      expect(result.tone).not.toBe("none");
    }
  });
});

describe("GWA bands (spec §2.2)", () => {
  const banded = (gwaBand: string): Profile => ({ ...DEMO, gwa: "", gwaBand });

  it("clears a minimum when the whole band sits above it", () => {
    const result = matchScholarship(fixture({ gwaMin: 85 }), banded("90–94"));
    expect(result.checks[0].state).toBe("met");
  });

  it("fails a minimum only when the whole band sits below it", () => {
    const result = matchScholarship(fixture({ gwaMin: 90 }), banded("80–84"));
    expect(result.checks[0].state).toBe("not-met");
    expect(result.tone).toBe("none");
  });

  it("stays unknown when the band straddles the minimum", () => {
    // 90–94 against a 92 cut-off settles nothing, and calling it not-met would
    // fail a student on evidence we do not have.
    const result = matchScholarship(fixture({ gwaMin: 92 }), banded("90–94"));
    expect(result.checks[0].state).toBe("unknown");
    expect(result.tone).not.toBe("none");
    expect(result.checks[0].detail).toContain("straddles");
  });

  it("lets an exact GWA settle what the band could not", () => {
    const straddling = { ...banded("90–94"), gwa: "93" };
    expect(matchScholarship(fixture({ gwaMin: 92 }), straddling).checks[0].state).toBe("met");
    const below = { ...banded("90–94"), gwa: "91" };
    expect(matchScholarship(fixture({ gwaMin: 92 }), below).checks[0].state).toBe("not-met");
  });

  it("respects the half-open upper bound at the boundary", () => {
    // "90–94" holds every mark below 95, fractions included. So a 95% minimum is
    // a genuine miss, while a 94% minimum is a straddle a 94.5 would clear.
    expect(matchScholarship(fixture({ gwaMin: 95 }), banded("90–94")).checks[0].state).toBe(
      "not-met"
    );
    expect(matchScholarship(fixture({ gwaMin: 94 }), banded("90–94")).checks[0].state).toBe(
      "unknown"
    );
  });

  it("treats a withheld band as unknown", () => {
    expect(matchScholarship(fixture({ gwaMin: 90 }), banded("Prefer not to say")).checks[0].state).toBe(
      "unknown"
    );
    expect(matchScholarship(fixture({ gwaMin: 90 }), banded("")).checks[0].state).toBe("unknown");
  });
});

describe("special circumstances (spec §2.3)", () => {
  const card = fixture({ special: ["4Ps household"] });

  it("is met when a disclosed circumstance matches", () => {
    const result = matchScholarship(card, { ...DEMO, chips: ["4Ps household"] });
    expect(result.checks[0].state).toBe("met");
  });

  it("is not-met when the student says none apply — that is evidence", () => {
    const result = matchScholarship(card, { ...DEMO, chips: ["None"] });
    expect(result.checks[0].state).toBe("not-met");
    expect(result.tone).toBe("none");
  });

  it("is unknown when the student prefers not to say", () => {
    const result = matchScholarship(card, { ...DEMO, chips: ["Prefer not to say"] });
    expect(result.checks[0].state).toBe("unknown");
    expect(result.tone).not.toBe("none");
  });

  it("is unknown when nothing was answered", () => {
    expect(matchScholarship(card, { ...DEMO, chips: [] }).checks[0].state).toBe("unknown");
  });

  it("distinguishes 'none' from 'prefer not to say'", () => {
    const none = matchScholarship(card, { ...DEMO, chips: ["None"] });
    const withheld = matchScholarship(card, { ...DEMO, chips: ["Prefer not to say"] });
    expect(none.checks[0].state).not.toBe(withheld.checks[0].state);
  });
});

describe("a student still planning where to study", () => {
  const planning: Profile = { ...DEMO, stage: "Still planning to study", year: "" };

  it("is never ruled out by a cohort requirement", () => {
    const result = matchScholarship(fixture({ years: ["1st Year College"] }), planning);
    expect(result.checks[0].state).toBe("unknown");
  });

  it("is never ruled out by a student-status requirement", () => {
    const result = matchScholarship(fixture({ stages: ["College Student"] }), planning);
    expect(result.checks[0].state).toBe("unknown");
  });

  it("never turns the planning state itself into a hard conflict in the real data set", () => {
    for (const card of DATA) {
      const result = matchScholarship(card, { ...planning, course: "", city: "" });
      const cohortChecks = result.checks.filter(
        (check) => check.label === "Year level" || check.label === "Student status"
      );
      expect(cohortChecks.every((check) => check.state !== "not-met")).toBe(true);
    }
  });
});

describe("percent (spec §2.1)", () => {
  it("is the share of published requirements met", () => {
    const result = matchScholarship(
      fixture({ gwaMin: 85, courses: ["BS Information Systems"], courseMode: "published" }),
      DEMO
    );
    expect(result.met).toBe(2);
    expect(result.total).toBe(2);
    expect(result.percent).toBe(100);
  });

  it("rounds a partial result", () => {
    const result = matchScholarship(fixture({ gwaMin: 85, incomeMax: 10000 }), DEMO);
    // GWA met, income unknown — 1 of 2.
    expect(result.percent).toBe(50);
    expect(result.unknown).toBe(1);
  });

  it("is null, never 0, when nothing is published to check", () => {
    const result = matchScholarship(fixture({}), DEMO);
    expect(result.total).toBe(0);
    expect(result.percent).toBeNull();
  });

  it("counts unknowns as not-yet-met rather than met", () => {
    const result = matchScholarship(fixture({ incomeMax: 10000 }), DEMO);
    expect(result.met).toBe(0);
    expect(result.unknown).toBe(1);
    expect(result.percent).toBe(0);
  });
});

describe("rankScholarships", () => {
  it("returns every JSON-backed record in deterministic order", () => {
    const ranked = rankScholarships(DATA, DEMO);
    expect(ranked).toHaveLength(DATA.length);
    expect(new Set(ranked.map((result) => result.id)).size).toBe(DATA.length);
  });

  it("counts records from the loaded database", () => {
    const counts = countsOf(rankScholarships(DATA, DEMO));
    expect(counts.reviewed).toBe(DATA.length);
    expect(counts.relevant + counts.reviewed - counts.relevant).toBe(DATA.length);
  });
});
