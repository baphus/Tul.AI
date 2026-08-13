import { describe, expect, it } from "vitest";

import {
  groupLabel,
  inGroup,
  summariseSupport,
  type SummarisableScholarship,
} from "@/lib/logic/estimate";

function card(
  over: Partial<SummarisableScholarship> = {}
): SummarisableScholarship {
  return {
    kind: "national",
    amount: 30_000,
    deadlineIso: "2026-09-30",
    lastVerified: "2026-08-01",
    verification: "Verified",
    ...over,
  };
}

describe("summariseSupport", () => {
  it("describes the whole set under the 'all' group", () => {
    const summary = summariseSupport(
      [
        card({ amount: 10_000, deadlineIso: "2026-10-01", lastVerified: "2026-07-01" }),
        card({ kind: "lgu", amount: 60_000, deadlineIso: "2026-08-20" }),
      ],
      "all"
    );

    expect(summary.count).toBe(2);
    expect(summary.lowest).toBe(10_000);
    expect(summary.highest).toBe(60_000);
    expect(summary.soonestDeadlineIso).toBe("2026-08-20");
    // The most recent check across the slice, not the oldest.
    expect(summary.lastVerified).toBe("2026-08-01");
  });

  it("narrows to a single provider kind", () => {
    const summary = summariseSupport(
      [card({ kind: "national", amount: 90_000 }), card({ kind: "university", amount: 5_000 })],
      "university"
    );

    expect(summary.count).toBe(1);
    expect(summary.lowest).toBe(5_000);
    expect(summary.highest).toBe(5_000);
  });

  it("counts only records whose verification state is Verified", () => {
    const summary = summariseSupport(
      [
        card({ verification: "Verified" }),
        card({ verification: "Needs Verification" }),
        card({ verification: "Unknown" }),
      ],
      "all"
    );

    expect(summary.count).toBe(3);
    expect(summary.verifiedCount).toBe(1);
  });

  it("returns nulls rather than Infinity for an empty group", () => {
    const summary = summariseSupport([card({ kind: "national" })], "lgu");

    expect(summary.count).toBe(0);
    expect(summary.verifiedCount).toBe(0);
    expect(summary.lowest).toBeNull();
    expect(summary.highest).toBeNull();
    expect(summary.soonestDeadlineIso).toBeNull();
    expect(summary.lastVerified).toBeNull();
  });

  it("does not mutate the input order", () => {
    const cards = [
      card({ deadlineIso: "2026-12-01" }),
      card({ deadlineIso: "2026-01-01" }),
    ];
    summariseSupport(cards, "all");

    expect(cards[0].deadlineIso).toBe("2026-12-01");
  });
});

describe("inGroup", () => {
  it("passes everything through the 'all' group", () => {
    expect(inGroup(card({ kind: "lgu" }), "all")).toBe(true);
  });

  it("matches on kind otherwise", () => {
    expect(inGroup(card({ kind: "lgu" }), "lgu")).toBe(true);
    expect(inGroup(card({ kind: "lgu" }), "university")).toBe(false);
  });
});

describe("groupLabel", () => {
  it("names every group", () => {
    expect(groupLabel("all")).toBe("Every provider we cover");
    expect(groupLabel("lgu")).toBe("City & provincial governments");
  });
});
