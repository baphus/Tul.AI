import { describe, expect, it } from "vitest";
import { DATA, KIND } from "@/lib/scholarships";
import { advisory } from "./advisory";

const NO = Array(DATA.length).fill(undefined);
const YES = (indexes: number[]) => {
  const d = [...NO];
  for (const i of indexes) d[i] = "yes";
  return d;
};

describe("advisory", () => {
  it("flags two national programs", () => {
    const indexes = KIND.map((kind, index) => (kind === "national" ? index : -1)).filter((index) => index >= 0).slice(0, 2);
    const adv = advisory(YES(indexes));
    expect(adv?.id).toBe("national");
    expect(adv?.title).toContain(DATA[indexes[0]].provider);
    expect(adv?.title).toContain(DATA[indexes[1]].provider);
  });

  it("prefers the national rule over the three-applications rule", () => {
    const indexes = KIND.map((kind, index) => (kind === "national" ? index : -1)).filter((index) => index >= 0).slice(0, 2);
    indexes.push(KIND.findIndex((kind) => kind !== "national"));
    const adv = advisory(YES(indexes));
    expect(adv?.id).toBe("national");
  });

  it("prioritizes the national-program warning for this dataset", () => {
    const adv = advisory(YES([0, 1, 2]));
    expect(adv?.id).toBe("national");
  });

  it("flags two deadlines within the same fortnight", () => {
    // The current seed is national-only, so the national warning takes
    // precedence over the deadline-cluster advice.
    expect(advisory(YES([0, 1]))?.id).toBe("national");
  });

  it("returns nothing for a single interested program", () => {
    expect(advisory(YES([0]))).toBeNull();
  });

  it("returns nothing when nothing is marked", () => {
    expect(advisory(NO)).toBeNull();
  });
});
