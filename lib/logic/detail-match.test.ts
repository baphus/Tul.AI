import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import { detailRequirements } from "./detail-match";
import { matchScholarship } from "./matching";
import { emptyProfile } from "./state";

describe("detailRequirements", () => {
  it("projects the same live deterministic checks used to rank a scholarship", () => {
    const profile = {
      ...emptyProfile(),
      city: "Cebu City",
      stage: "College Student",
      school: "Cebu Technological University",
      course: "BS Information Systems",
      year: "1st Year",
      gwa: "94.5",
      citizenship: "Filipino",
    };
    const result = matchScholarship(DATA[0], profile);

    expect(detailRequirements(result)).toEqual(
      result.checks.map((check) => ({
        label: check.label,
        text: check.detail,
        state:
          check.state === "met" ? "ok" : check.state === "not-met" ? "warn" : "none",
      }))
    );
  });
});
