import { describe, expect, it } from "vitest";

import { DATA, type Scholarship } from "@/lib/scholarships";
import { emptyProfile, type Profile } from "./state";
import { countsOf, matchScholarship, rankScholarships } from "./matching";

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
