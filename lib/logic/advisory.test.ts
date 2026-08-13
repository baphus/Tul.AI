import { describe, expect, it } from "vitest";
import { DATA } from "@/lib/scholarships";
import { advisory } from "./advisory";

const NO = Array(DATA.length).fill(undefined);
const YES = (indexes: number[]) => {
  const d = [...NO];
  for (const i of indexes) d[i] = "yes";
  return d;
};

describe("advisory", () => {
  it("flags two national programs (CHED + DOST)", () => {
    const adv = advisory(YES([0, 1]));
    expect(adv?.id).toBe("national");
    expect(adv?.title).toContain("CHED");
    expect(adv?.title).toContain("DOST-SEI");
  });

  it("prefers the national rule over the three-applications rule", () => {
    const adv = advisory(YES([0, 1, 4]));
    expect(adv?.id).toBe("national");
  });

  it("flags three applications for a shared document set", () => {
    const adv = advisory(YES([0, 3, 4]));
    expect(adv?.id).toBe("documents");
  });

  it("flags two deadlines within the same fortnight", () => {
    // 0 (CHED, 19 days) and 3 (Cebu City, 11 days) — both soon
    const adv = advisory(YES([0, 3]));
    expect(adv?.id).toBe("deadlines");
    expect(adv?.title).toContain("fortnight");
  });

  it("returns nothing for a single interested program", () => {
    expect(advisory(YES([0]))).toBeNull();
  });

  it("returns nothing when nothing is marked", () => {
    expect(advisory(NO)).toBeNull();
  });
});