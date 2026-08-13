import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import {
  daysBetween,
  daysUntil,
  deadlineLabel,
  deadlineTone,
  formatIsoDate,
  localIsoDate,
} from "./deadlines";

describe("daysUntil", () => {
  it("counts whole calendar days", () => {
    expect(daysUntil("2026-08-30", "2026-08-13")).toBe(17);
    expect(daysUntil("2026-08-13", "2026-08-13")).toBe(0);
    expect(daysUntil("2026-08-12", "2026-08-13")).toBe(-1);
  });

  it("crosses month and year boundaries", () => {
    expect(daysUntil("2026-09-01", "2026-08-31")).toBe(1);
    expect(daysUntil("2027-01-01", "2026-12-31")).toBe(1);
  });

  it("returns NaN for an unparseable date", () => {
    expect(daysUntil("not-a-date", "2026-08-13")).toBeNaN();
  });
});

describe("deadlineTone", () => {
  it("escalates as the date approaches", () => {
    expect(deadlineTone(-1)).toBe("closed");
    expect(deadlineTone(0)).toBe("urgent");
    expect(deadlineTone(7)).toBe("urgent");
    expect(deadlineTone(8)).toBe("soon");
    expect(deadlineTone(21)).toBe("soon");
    expect(deadlineTone(22)).toBe("open");
  });

  it("treats an unknown deadline as open rather than closed", () => {
    expect(deadlineTone(Number.NaN)).toBe("open");
  });
});

describe("deadlineLabel", () => {
  it("reads naturally at every distance", () => {
    expect(deadlineLabel(17)).toBe("17 days left");
    expect(deadlineLabel(1)).toBe("1 day left");
    expect(deadlineLabel(0)).toBe("Closes today");
    expect(deadlineLabel(-3)).toBe("Application period has closed");
    expect(deadlineLabel(Number.NaN)).toBe("Deadline not published");
  });
});

describe("localIsoDate", () => {
  it("formats a local date without timezone shifting", () => {
    expect(localIsoDate(new Date(2026, 7, 3))).toBe("2026-08-03");
    expect(localIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("formatIsoDate", () => {
  it("spells out the verification date", () => {
    expect(formatIsoDate("2026-08-11")).toBe("11 August 2026");
  });

  it("passes through anything it cannot parse", () => {
    expect(formatIsoDate("soon")).toBe("soon");
  });
});

describe("scholarship data", () => {
  it("gives every record a machine-readable deadline and verification state", () => {
    for (const card of DATA) {
      expect(card.deadlineIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(daysUntil(card.deadlineIso, "2026-08-13"))).toBe(false);
      expect(card.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(card.verification).toBeTruthy();
      expect(card.sourceTier).toBeGreaterThanOrEqual(1);
      // Source-trust rule: nothing is "Verified" on Tier 4 evidence alone.
      if (card.verification === "Verified") expect(card.sourceTier).toBeLessThan(4);
    }
  });

  it("keeps the display deadline consistent with the ISO one", () => {
    for (const card of DATA) {
      const year = card.deadlineIso.slice(0, 4);
      if (year === "9999") expect(card.deadline).toBe("No published deadline");
      else expect(card.deadline).toContain(year);
    }
  });
});

describe("daysBetween", () => {
  it("is order independent", () => {
    expect(daysBetween("2026-08-22", "2026-08-30")).toBe(8);
    expect(daysBetween("2026-08-30", "2026-08-22")).toBe(8);
  });
});
