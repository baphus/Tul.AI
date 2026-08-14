import { describe, expect, it } from "vitest";

import { emptyProfile, type Profile } from "./state";
import {
  canAdvance,
  dependentsError,
  firstIncompleteStep,
  gwaError,
  isPlanning,
  isProfileReady,
  matchingRecoveryStep,
  profileCompleteness,
} from "./validation";

const answered = (over: Partial<Profile> = {}): Profile => ({
  ...emptyProfile(),
  city: "Cebu City",
  course: "BS Information Systems",
  stage: "College Student",
  ...over,
});

describe("gwaError", () => {
  it("accepts an empty GWA (unknown is allowed)", () => {
    expect(gwaError("")).toBe(false);
    expect(gwaError("   ")).toBe(false);
  });

  it("accepts values within [60, 100]", () => {
    expect(gwaError("60")).toBe(false);
    expect(gwaError("94.5")).toBe(false);
    expect(gwaError("100")).toBe(false);
  });

  it("rejects out-of-range or non-numeric values", () => {
    expect(gwaError("59.9")).toBe(true);
    expect(gwaError("100.1")).toBe(true);
    expect(gwaError("abc")).toBe(true);
    expect(gwaError("9a")).toBe(true);
  });
});

describe("dependentsError", () => {
  it("accepts an empty value and whole numbers 0–20", () => {
    expect(dependentsError("")).toBe(false);
    expect(dependentsError("0")).toBe(false);
    expect(dependentsError("6")).toBe(false);
    expect(dependentsError("20")).toBe(false);
  });

  it("rejects fractions, negatives and nonsense", () => {
    expect(dependentsError("2.5")).toBe(true);
    expect(dependentsError("-1")).toBe(true);
    expect(dependentsError("21")).toBe(true);
    expect(dependentsError("many")).toBe(true);
  });
});

describe("canAdvance", () => {
  it("requires where the student is in their studies on step 1", () => {
    expect(canAdvance(1, emptyProfile())).toBe(false);
    expect(canAdvance(1, answered())).toBe(true);
  });

  it("requires where they're based on step 2", () => {
    expect(canAdvance(2, answered({ city: "" }))).toBe(false);
    expect(canAdvance(2, answered())).toBe(true);
  });

  it("requires what they study on step 3", () => {
    expect(canAdvance(3, answered({ course: "" }))).toBe(false);
    expect(canAdvance(3, answered())).toBe(true);
  });

  it("never blocks the academic step, but rejects an impossible GWA", () => {
    expect(canAdvance(4, emptyProfile())).toBe(true);
    expect(canAdvance(4, answered({ gwaBand: "90–94" }))).toBe(true);
    // a blank GWA is unknown, not invalid
    expect(canAdvance(4, answered({ gwa: "" }))).toBe(true);
    expect(canAdvance(4, answered({ gwa: "120" }))).toBe(false);
  });

  it("never blocks the household step, but rejects an impossible size", () => {
    expect(canAdvance(5, emptyProfile())).toBe(true);
    expect(canAdvance(5, answered({ householdBand: "5–6" }))).toBe(true);
    expect(canAdvance(5, answered({ dependents: "-2" }))).toBe(false);
  });

  it("never blocks the free-text step", () => {
    expect(canAdvance(6, emptyProfile())).toBe(true);
  });

  it("never asks a student still planning for a school", () => {
    // The whole point of the "Still planning" path: they can finish onboarding
    // without ever naming a campus.
    const planning = answered({ stage: "Still planning to study", school: "" });
    for (let step = 1; step <= 6; step++) {
      expect(canAdvance(step, planning)).toBe(true);
    }
  });
});

describe("firstIncompleteStep", () => {
  it("resumes at the first unanswered question", () => {
    expect(firstIncompleteStep(emptyProfile())).toBe(1);
    expect(firstIncompleteStep(answered({ stage: "" }))).toBe(1);
    expect(firstIncompleteStep(answered({ city: "" }))).toBe(2);
    expect(firstIncompleteStep(answered({ course: "" }))).toBe(3);
    expect(firstIncompleteStep(answered())).toBe(6);
  });
});

describe("matchingRecoveryStep", () => {
  it("returns to the first answer that prevents matching", () => {
    expect(matchingRecoveryStep(emptyProfile())).toBe(1);
    expect(matchingRecoveryStep(answered({ city: "" }))).toBe(2);
    expect(matchingRecoveryStep(answered({ course: "" }))).toBe(3);
  });
});

describe("isProfileReady", () => {
  it("needs location and course before matching can run", () => {
    expect(isProfileReady(emptyProfile())).toBe(false);
    expect(isProfileReady(answered({ city: "" }))).toBe(false);
    expect(isProfileReady(answered({ course: "" }))).toBe(false);
    // a missing stage is unknown, never a blocker
    expect(isProfileReady(answered({ stage: "" }))).toBe(true);
    expect(isProfileReady(answered())).toBe(true);
  });

  it("does not require money or background answers", () => {
    expect(isProfileReady(answered({ income: "", chips: [], notes: "" }))).toBe(true);
  });
});

describe("isPlanning", () => {
  it("recognises the student who has not committed to a school", () => {
    expect(isPlanning(answered({ stage: "Still planning to study" }))).toBe(true);
    expect(isPlanning(answered({ stage: "College Student" }))).toBe(false);
    expect(isPlanning(emptyProfile())).toBe(false);
  });
});

describe("profileCompleteness", () => {
  it("counts filled fields out of the full set", () => {
    expect(profileCompleteness(emptyProfile())).toEqual({ filled: 0, total: 10 });
    expect(profileCompleteness(answered()).filled).toBe(3);
    expect(
      profileCompleteness(answered({ chips: ["OFW parent"], income: "Below ₱10,000" })).filled
    ).toBe(5);
  });

  it("counts a band and its exact counterpart once between them", () => {
    // Answering the band *is* answering the question; showing an unfilled
    // segment for declining the exact figure would push disclosure the privacy
    // model does not want (AGENTS.md §9).
    const band = profileCompleteness(answered({ gwaBand: "90–94" })).filled;
    const both = profileCompleteness(answered({ gwaBand: "90–94", gwa: "92" })).filled;
    expect(both).toBe(band);

    const exactOnly = profileCompleteness(answered({ gwa: "92" })).filled;
    expect(exactOnly).toBe(band);
  });
});
