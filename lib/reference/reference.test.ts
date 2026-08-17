import { describe, expect, it } from "vitest";

import {
  GWA_BANDS,
  HOUSEHOLD_BANDS,
  WITHHELD,
  bandByValue,
  bandFor,
  upperExclusive,
} from "./bands";
import { COURSE_GROUPS, COURSE_OPTIONS } from "./courses";
import { CEBU_LOCATION_OPTIONS, LOCATION_OPTIONS, provinceOf } from "./locations";
import { SCHOOL_OPTIONS, schoolsFor } from "./schools";

describe("bands", () => {
  it("cover the GWA scale without gaps or overlaps", () => {
    const sorted = [...GWA_BANDS].sort((a, b) => a.low - b.low);
    expect(sorted[0].low).toBe(60);
    expect(sorted[sorted.length - 1].high).toBe(100);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].low).toBe(sorted[i - 1].high + 1);
    }
  });

  it("cover household sizes without gaps", () => {
    const sorted = [...HOUSEHOLD_BANDS].sort((a, b) => a.low - b.low);
    expect(sorted[0].low).toBe(1);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].low).toBe(sorted[i - 1].high + 1);
    }
  });

  it("resolve a stored value to its interval", () => {
    expect(bandByValue(GWA_BANDS, "90–94")).toMatchObject({ low: 90, high: 94 });
  });

  it("treat an empty answer and a withheld one as no interval", () => {
    expect(bandByValue(GWA_BANDS, "")).toBeNull();
    expect(bandByValue(GWA_BANDS, WITHHELD)).toBeNull();
    expect(bandByValue(GWA_BANDS, "not a band")).toBeNull();
  });

  it("find the band an exact figure falls into", () => {
    expect(bandFor(GWA_BANDS, 92)?.value).toBe("90–94");
    expect(bandFor(GWA_BANDS, 95)?.value).toBe("95–100");
    expect(bandFor(GWA_BANDS, 50)).toBeNull();
  });

  it("places a fractional mark in the band a student would pick", () => {
    // The interval is half-open: 94.5 belongs in "90–94", not in a gap between
    // bands. A closed integer range would have dropped it entirely.
    expect(bandFor(GWA_BANDS, 94.5)?.value).toBe("90–94");
    expect(bandFor(GWA_BANDS, 94.99)?.value).toBe("90–94");
    expect(bandFor(GWA_BANDS, 89.5)?.value).toBe("85–89");
    expect(bandFor(GWA_BANDS, 79.9)?.value).toBe("Below 80");
  });

  it("exposes the exclusive upper bound the arithmetic uses", () => {
    expect(upperExclusive(GWA_BANDS[1])).toBe(95);
  });
});

describe("courses", () => {
  it("holds no duplicate programme names", () => {
    const names = COURSE_OPTIONS.map((option) => option.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("groups every option exactly once", () => {
    const grouped = COURSE_GROUPS.flatMap((group) => group.items);
    expect(grouped).toHaveLength(COURSE_OPTIONS.length);
    expect(new Set(grouped.map((item) => item.name)).size).toBe(COURSE_OPTIONS.length);
  });

  it("offers a list worth searching", () => {
    expect(COURSE_OPTIONS.length).toBeGreaterThanOrEqual(100);
  });

  it("has no empty group", () => {
    for (const group of COURSE_GROUPS) expect(group.items.length).toBeGreaterThan(0);
  });
});

describe("locations", () => {
  it("holds no duplicate values", () => {
    const values = LOCATION_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("resolves a listed city to its province", () => {
    expect(provinceOf("Cebu City")).toBe("Cebu");
    expect(provinceOf("Iloilo City")).toBe("Iloilo");
  });

  it("only suggests Cebu locations during onboarding", () => {
    expect(CEBU_LOCATION_OPTIONS.length).toBeGreaterThan(0);
    expect(CEBU_LOCATION_OPTIONS.every((option) => option.province === "Cebu")).toBe(true);
  });

  it("resolves the coarse onboarding quick pills", () => {
    // These are the five LOCATIONS pills, which are coarser than the searchable
    // list — "Elsewhere in Cebu" is not a city and must still find Cebu.
    expect(provinceOf("Cebu Province")).toBe("Cebu");
    expect(provinceOf("Metro Manila")).toBe("Metro Manila");
    expect(provinceOf("Davao")).toBe("Davao del Sur");
  });

  it("returns null for free text it cannot place", () => {
    expect(provinceOf("")).toBeNull();
    expect(provinceOf("Somewhere else")).toBeNull();
  });
});

describe("schools", () => {
  it("holds no duplicate names", () => {
    const names = SCHOOL_OPTIONS.map((school) => school.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("narrows to a city when that city has enough schools", () => {
    const filter = schoolsFor("Cebu City");
    expect(filter.scope).toBe("city");
    expect(filter.place).toBe("Cebu City");
    expect(filter.schools.every((school) => school.city === "Cebu City")).toBe(true);
  });

  it("widens to the province when a city has too few to be useful", () => {
    // Talisay City holds one school; showing one and hiding the twenty next door
    // would be worse than showing the province.
    const filter = schoolsFor("Talisay City");
    expect(filter.scope).toBe("province");
    expect(filter.place).toBe("Cebu");
    expect(filter.schools.length).toBeGreaterThan(1);
  });

  it("falls back to everything for an unplaceable answer", () => {
    const filter = schoolsFor("Somewhere else");
    expect(filter.scope).toBe("all");
    expect(filter.schools).toHaveLength(SCHOOL_OPTIONS.length);
  });

  it("offers every school when no location is given", () => {
    expect(schoolsFor("").schools).toHaveLength(SCHOOL_OPTIONS.length);
  });

  it("never returns an empty list, whatever the input", () => {
    for (const input of ["", "Cebu City", "Talisay City", "Mars", "  "]) {
      expect(schoolsFor(input).schools.length).toBeGreaterThan(0);
    }
  });

  it("places every school in a province the location list knows", () => {
    const provinces = new Set(LOCATION_OPTIONS.map((option) => option.province));
    for (const school of SCHOOL_OPTIONS) {
      expect(provinces.has(school.province)).toBe(true);
    }
  });
});
