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

  /*
   * The data adapter sets `amount: 0` when a provider states its benefit in
   * prose it cannot parse into a figure — 12 of the 32 records in the current
   * data set. Those zeros must not enter the range: a group holding a ₱0 record
   * alongside a ₱177,000 one published "₱0 – ₱177,000" on the landing page,
   * which reads as a programme that pays nothing rather than one whose figure we
   * could not extract.
   */
  it("excludes unparseable (zero) amounts from the range but still counts them", () => {
    const summary = summariseSupport(
      [
        card({ amount: 0 }),
        card({ amount: 20_000 }),
        card({ amount: 0 }),
        card({ amount: 177_000 }),
      ],
      "all"
    );

    expect(summary.count).toBe(4);
    expect(summary.lowest).toBe(20_000);
    expect(summary.highest).toBe(177_000);
  });

  it("reports a null range when no record in the group publishes a figure", () => {
    const summary = summariseSupport([card({ amount: 0 }), card({ amount: 0 })], "all");

    expect(summary.count).toBe(2);
    expect(summary.lowest).toBeNull();
    expect(summary.highest).toBeNull();
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
