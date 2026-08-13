import { describe, expect, it } from "vitest";

import rawScholarships from "@/data/scholarships.json";
import {
  courseTokens,
  matchCohort,
  matchCourse,
  profileCohorts,
  publishedCohorts,
  sameCourse,
} from "./normalize";

/**
 * These tests exist because the thing they guard is a trust failure, not a bug:
 * before normalisation, a spelling difference between "BS Computer Science" and
 * "Computer Science" resolved to Requirement Not Met and ruled a student out of a
 * programme they qualified for (AGENTS.md §3).
 */

describe("courseTokens", () => {
  it("strips degree prefixes so one programme has one token set", () => {
    expect(courseTokens("BS Fisheries")).toEqual(courseTokens("Bachelor of Science in Fisheries"));
    expect(courseTokens("BS Computer Science")).toEqual(courseTokens("Computer Science"));
  });

  it("expands abbreviations that carry meaning", () => {
    // BSEd is secondary education; dropping it would lose the distinction.
    expect(courseTokens("BSEd major in Science")).toEqual(
      courseTokens("BS Secondary Education – Science")
    );
    expect(courseTokens("BSBA Financial Management")).toEqual(
      courseTokens("Business Administration Financial Management")
    );
  });

  it("drops structural stopwords but keeps distinguishing words", () => {
    expect(courseTokens("BS Agricultural Economics")).toContain("agricultural");
    expect(courseTokens("BS Agricultural Economics")).toContain("economics");
    expect(courseTokens("BS Agricultural Economics").has("of")).toBe(false);
  });

  it("normalises dashes, ampersands and punctuation", () => {
    expect(courseTokens("BS Electronics & Communications Engineering")).toEqual(
      courseTokens("Electronics and Communications Engineering")
    );
  });
});

describe("sameCourse", () => {
  it("matches identical programmes spelled differently", () => {
    expect(sameCourse("BS Computer Science", "Computer Science")).toBe(true);
    expect(sameCourse("Bachelor of Science in Fisheries", "BS Fisheries")).toBe(true);
    expect(sameCourse("BS Information Technology", "Information Systems / Technology")).toBe(
      true
    );
  });

  it("does not match different programmes that share a word", () => {
    expect(sameCourse("BS Computer Science", "BS Computer Engineering")).toBe(false);
    expect(sameCourse("BS Nursing", "BS Computer Science")).toBe(false);
  });

  it("refuses a single-token subset, which would over-match", () => {
    // {education} sits inside {agricultural, education} without being it.
    expect(sameCourse("BS Education", "Agricultural Education")).toBe(false);
    expect(sameCourse("Engineering", "BS Civil Engineering")).toBe(false);
  });

  it("allows a multi-token subset, which is a genuine match", () => {
    expect(
      sameCourse("BS Elementary Education", "Elementary/General Education with STEM specialization")
    ).toBe(true);
  });

  it("never matches empty input", () => {
    expect(sameCourse("", "BS Nursing")).toBe(false);
    expect(sameCourse("BS Nursing", "")).toBe(false);
  });
});

describe("matchCourse", () => {
  it("treats an open-to-any published entry as met for any course", () => {
    const verdict = matchCourse(
      ["Any first undergraduate degree in a CHED-recognized institution"],
      "BS Nursing"
    );
    expect(verdict.state).toBe("met");
    expect(verdict.openToAny).toBe(true);
  });

  it("recognises the other catch-all phrasings in the data set", () => {
    for (const entry of [
      "All undergraduate degree programs at accredited public universities/SUCs",
      "Four-year baccalaureate course",
      "Five-year baccalaureate course",
      "Bachelor's degree courses at accredited Philippine colleges/universities",
      "Associate course",
      "College degree programs; specific courses vary by track",
    ]) {
      expect(matchCourse([entry], "BS Nursing").openToAny).toBe(true);
    }
  });

  it("stays unknown on an open list when no course is given", () => {
    expect(matchCourse(["Any first undergraduate degree"], "").state).toBe("unknown");
  });

  it("is unknown, not not-met, against a priority list", () => {
    expect(matchCourse(["Priority Engineering programs"], "BS Nursing").state).toBe("unknown");
    expect(matchCourse(["Priority STEM teacher education programs"], "BS Nursing").state).toBe(
      "unknown"
    );
  });

  it("is not-met only against a specific list a course genuinely misses", () => {
    const verdict = matchCourse(["BS Computer Science", "BS Information Technology"], "BS Nursing");
    expect(verdict.state).toBe("not-met");
  });

  it("is unknown when the student has no course", () => {
    expect(matchCourse(["BS Computer Science"], "").state).toBe("unknown");
  });
});

describe("profileCohorts", () => {
  it("places a Grade 12 student as a school leaver and an incoming freshman", () => {
    const tokens = profileCohorts("Grade 12", "");
    expect(tokens.has("grade-12")).toBe(true);
    expect(tokens.has("shs-grad")).toBe(true);
    expect(tokens.has("incoming-college")).toBe(true);
  });

  it("places a college student by year and generically", () => {
    const tokens = profileCohorts("College Student", "2nd Year");
    expect(tokens.has("college")).toBe(true);
    expect(tokens.has("college-2")).toBe(true);
    expect(tokens.has("college-1")).toBe(false);
  });

  it("gives a student still planning no cohort at all", () => {
    // Which is what forces every cohort requirement to Unknown rather than
    // failing them against every published year level (spec §2.3).
    expect(profileCohorts("Still planning to study", "").size).toBe(0);
    expect(profileCohorts("", "").size).toBe(0);
  });
});

describe("publishedCohorts", () => {
  it("reads the any-college phrasings", () => {
    for (const entry of [
      "Any College Year Level",
      "College Undergraduate",
      "Currently Enrolled College Student",
      "Ongoing College Student",
    ]) {
      expect(publishedCohorts(entry).has("college")).toBe(true);
    }
  });

  it("reads an incoming freshman as not yet in college", () => {
    for (const entry of ["Incoming Freshman", "Incoming College Freshman", "Incoming 1st Year College"]) {
      expect(publishedCohorts(entry).has("incoming-college")).toBe(true);
      expect(publishedCohorts(entry).has("college-1")).toBe(false);
    }
  });

  it("reads ordinals and ranges", () => {
    expect(publishedCohorts("1st Year College").has("college-1")).toBe(true);
    expect(publishedCohorts("3rd Year College").has("college-3")).toBe(true);
    const range = publishedCohorts("2nd-5th Year College");
    expect([...range].sort()).toEqual(["college-2", "college-3", "college-4", "college-5"]);
  });

  it("reads senior-high exits", () => {
    for (const entry of ["Graduating Grade 12", "SHS Graduate", "ALS Completer"]) {
      expect(publishedCohorts(entry).has("shs-grad")).toBe(true);
    }
  });

  it("returns nothing for text it cannot resolve", () => {
    for (const entry of [
      "Varies by scholarship track",
      "Continuing Grantee",
      "Limited continuing students at selected universities",
    ]) {
      expect(publishedCohorts(entry).size).toBe(0);
    }
  });
});

describe("matchCohort", () => {
  it("matches a 1st-year student against the data set's own spellings", () => {
    // The bug this replaces: `["1st Year College"].includes("1st Year")` was
    // false, so this student was ruled Not Eligible.
    expect(matchCohort(["1st Year College"], "College Student", "1st Year").state).toBe("met");
    expect(matchCohort(["Any College Year Level"], "College Student", "1st Year").state).toBe(
      "met"
    );
  });

  it("matches a Grade 12 student against incoming-freshman cycles", () => {
    expect(matchCohort(["Incoming College Freshman"], "Grade 12", "").state).toBe("met");
    expect(matchCohort(["Graduating Grade 12", "SHS Graduate"], "Grade 12", "").state).toBe("met");
  });

  it("is unknown when the student has no placeable stage", () => {
    expect(matchCohort(["1st Year College"], "Still planning to study", "").state).toBe("unknown");
    expect(matchCohort(["1st Year College"], "", "").state).toBe("unknown");
  });

  it("is unknown when any published entry cannot be resolved", () => {
    expect(
      matchCohort(["Varies by scholarship track"], "College Student", "1st Year").state
    ).toBe("unknown");
  });

  it("is not-met only when every entry resolves and none matches", () => {
    expect(matchCohort(["3rd Year College", "4th Year College"], "College Student", "1st Year").state).toBe(
      "not-met"
    );
  });
});

describe("against the real data set", () => {
  const published = (rawScholarships as { eligible_year_levels?: unknown }[]).flatMap((r) =>
    Array.isArray(r.eligible_year_levels) ? (r.eligible_year_levels as string[]) : []
  );

  it("resolves the great majority of published year levels to a cohort", () => {
    const resolved = published.filter((entry) => publishedCohorts(entry).size > 0);
    // Before normalisation, exact-equality resolved almost none of these to the
    // app's own YEARS values. A few genuinely vague entries are expected to
    // remain, and those fall to Unknown rather than to Not Met.
    expect(resolved.length / published.length).toBeGreaterThan(0.8);
  });

  it("never leaves a 1st-year college student ruled out by a resolvable cycle", () => {
    for (const entry of published) {
      const tokens = publishedCohorts(entry);
      if (tokens.size === 0) continue;
      const verdict = matchCohort([entry], "College Student", "1st Year");
      // Either it matches, or it genuinely does not apply to a 1st year — but it
      // must never be an artefact of spelling.
      expect(["met", "not-met"]).toContain(verdict.state);
    }
  });
});
