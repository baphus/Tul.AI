import { describe, expect, it } from "vitest";
import { DATA } from "@/lib/scholarships";
import { clamp01, formatPeso, requirementMetric } from "./format";

describe("formatPeso", () => {
  it("formats Philippine pesos with en-PH grouping", () => {
    expect(formatPeso(60000)).toBe("₱60,000");
    expect(formatPeso(40000)).toBe("₱40,000");
    expect(formatPeso(12000)).toBe("₱12,000");
    expect(formatPeso(0)).toBe("₱0");
  });
});

describe("requirementMetric", () => {
  it("computes the deterministic met/total percentage", () => {
    const metric = requirementMetric({ met: 8, total: 9, tone: "strong" });
    expect(metric).toEqual({ met: 8, total: 9, pct: 89, tone: "strong" });
  });

  it("never overshoots 100% and clamps met to total", () => {
    expect(requirementMetric({ met: 6, total: 6, tone: "strong" }).pct).toBe(100);
    expect(requirementMetric({ met: 99, total: 5, tone: "strong" }).met).toBe(5);
  });

  it("guards against a zero total", () => {
    expect(requirementMetric({ met: 0, total: 0, tone: "possible" }).total).toBe(1);
    expect(requirementMetric({ met: 0, total: 0, tone: "possible" }).pct).toBe(0);
  });

  it("works for every demo scholarship", () => {
    for (const card of DATA) {
      const m = requirementMetric(card);
      expect(m.met).toBeLessThanOrEqual(m.total);
      expect(m.pct).toBeGreaterThanOrEqual(0);
      expect(m.pct).toBeLessThanOrEqual(100);
    }
  });
});

describe("clamp01", () => {
  it("clamps into [0,1]", () => {
    expect(clamp01(-0.4)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1.3)).toBe(1);
  });
});