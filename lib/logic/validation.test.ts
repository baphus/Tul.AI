import { describe, expect, it } from "vitest";

import { emptyProfile, type Profile } from "./state";
import {
  canAdvance,
  dependentsError,
  firstIncompleteStep,
  gwaError,
  isProfileReady,
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
  it("requires where the student studies on step 1", () => {
    expect(canAdvance(1, emptyProfile())).toBe(false);
    expect(canAdvance(1, answered())).toBe(true);
  });

  it("requires what they study on step 2", () => {
    expect(canAdvance(2, answered({ course: "" }))).toBe(false);
    expect(canAdvance(2, answered())).toBe(true);
  });

  it("requires a stage on step 3 and blocks an invalid GWA", () => {
    expect(canAdvance(3, answered({ stage: "" }))).toBe(false);
    expect(canAdvance(3, answered())).toBe(true);
    expect(canAdvance(3, answered({ gwa: "120" }))).toBe(false);
    // a blank GWA is unknown, not invalid
    expect(canAdvance(3, answered({ gwa: "" }))).toBe(true);
  });

  it("never blocks the optional money and background step", () => {
    expect(canAdvance(4, emptyProfile())).toBe(true);
    expect(canAdvance(4, answered({ dependents: "4" }))).toBe(true);
    // …except when the number itself is impossible
    expect(canAdvance(4, answered({ dependents: "-2" }))).toBe(false);
  });

  it("never blocks the free-text step", () => {
    expect(canAdvance(5, emptyProfile())).toBe(true);
  });
});

describe("firstIncompleteStep", () => {
  it("resumes at the first unanswered question", () => {
    expect(firstIncompleteStep(emptyProfile())).toBe(1);
    expect(firstIncompleteStep(answered({ course: "" }))).toBe(2);
    expect(firstIncompleteStep(answered({ stage: "" }))).toBe(3);
    expect(firstIncompleteStep(answered())).toBe(5);
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

describe("profileCompleteness", () => {
  it("counts filled fields out of the full set", () => {
    expect(profileCompleteness(emptyProfile())).toEqual({ filled: 0, total: 10 });
    expect(profileCompleteness(answered()).filled).toBe(3);
    expect(
      profileCompleteness(answered({ chips: ["OFW parent"], income: "Below ₱10,000" })).filled
    ).toBe(5);
  });
});
