import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import { emptyProfile, type Profile } from "./state";
import {
  countsOf,
  matchScholarship,
  rankScholarships,
  type RankedMatch,
} from "./matching";

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

function result(id: string, profile: Profile): RankedMatch {
  const card = DATA.find((s) => s.id === id);
  if (!card) throw new Error(`no fixture: ${id}`);
  return matchScholarship(card, profile);
}

describe("matchScholarship", () => {
  it("buckets the demo profile into strong matches", () => {
    const ch = result("ched-merit-scholarship", DEMO);
    expect(ch.tone).toBe("strong");
    expect(ch.met).toBe(2);
    expect(ch.total).toBe(2);

    const dost = result("dost-sei-undergraduate-scholarship", DEMO);
    expect(dost.tone).toBe("strong");
    expect(dost.met).toBe(4);

    const ctu = result("ctu-academic-excellence-grant", DEMO);
    expect(ctu.tone).toBe("strong");
    expect(ctu.met).toBe(3);
  });

  it("an unconfirmed requirement keeps the tone out of the strong bucket", () => {
    const cebu = result("cebu-city-higher-education-assistance", DEMO);
    expect(cebu.tone).toBe("good");
    expect(cebu.met).toBe(3);
    expect(cebu.total).toBe(4);
    expect(cebu.checks.find((c) => c.label === "Household income")?.state).toBe("unknown");
  });

  it("treats a missing special category as unknown, never not-met", () => {
    const special = (r: RankedMatch) => r.checks.find((c) => c.label === "Special circumstances");

    const noChips = result("owwa-education-for-dependents", DEMO);
    expect(special(noChips)?.state).toBe("unknown");
    expect(noChips.tone).toBe("good");
    expect(noChips.met).toBe(1);

    const withheld = result("owwa-education-for-dependents", {
      ...DEMO,
      chips: ["Prefer not to say"],
    });
    expect(special(withheld)?.state).toBe("unknown");

    const affirmativelyOut = result("owwa-education-for-dependents", {
      ...DEMO,
      chips: ["None"],
    });
    expect(affirmativelyOut.tone).toBe("none");
    expect(special(affirmativelyOut)?.state).toBe("not-met");
  });

  it("an OFW-parent profile satisfies the OWWA special requirement", () => {
    const ofw = result("owwa-education-for-dependents", {
      ...DEMO,
      chips: ["OFW parent"],
    });
    expect(ofw.tone).toBe("strong");
    expect(ofw.met).toBe(2);
  });

  it("a priority course list resolves to unknown, a published one to not-met", () => {
    const priority = result("province-of-cebu-provincial-scholarship", DEMO);
    const course = priority.checks.find((c) => c.label === "Course");
    expect(course?.state).toBe("unknown");
    expect(priority.tone).toBe("good");

    const published = result("dost-sei-undergraduate-scholarship", {
      ...DEMO,
      course: "BS Education",
    });
    const hard = published.checks.find((c) => c.label === "Course");
    expect(hard?.state).toBe("not-met");
    expect(published.tone).toBe("none");
  });

  it("a GWA below the cut-off is a hard conflict", () => {
    const low = result("ctu-academic-excellence-grant", { ...DEMO, gwa: "80" });
    expect(low.tone).toBe("none");
  });

  it("income above the ceiling is a hard conflict", () => {
    const rich = result("cebu-city-higher-education-assistance", {
      ...DEMO,
      income: "Above ₱50,000",
    });
    expect(rich.tone).toBe("none");
  });

  it("an empty profile resolves everything to unknown, not not-met", () => {
    for (const card of DATA) {
      const r = matchScholarship(card, emptyProfile());
      expect(r.checks.every((c) => c.state !== "not-met")).toBe(true);
      expect(r.tone).not.toBe("none");
    }
  });
});

describe("rankScholarships", () => {
  it("orders by eligibility, then deadline, then amount", () => {
    const ranked = rankScholarships(DATA, DEMO).map((r) => r.id);
    expect(ranked).toEqual([
      "ched-merit-scholarship",
      "ctu-academic-excellence-grant",
      "dost-sei-undergraduate-scholarship",
      "cebu-city-higher-education-assistance",
      "province-of-cebu-provincial-scholarship",
      "owwa-education-for-dependents",
    ]);
  });

  it("a hard conflict sinks to the bottom regardless of amount", () => {
    const ranked = rankScholarships(DATA, {
      ...DEMO,
      school: "University of San Carlos",
      course: "BS Education",
    });
    const last = ranked[ranked.length - 1];
    expect(last.id).toBe("dost-sei-undergraduate-scholarship");
    expect(last.tone).toBe("none");
  });

  it("counts only the open programmes as relevant", () => {
    const counts = countsOf(rankScholarships(DATA, DEMO));
    expect(counts.reviewed).toBe(DATA.length);
    expect(counts.strong).toBe(3);
    expect(counts.relevant).toBe(DATA.length);
  });
});
