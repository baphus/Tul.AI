/**
 * Comparing what a student typed against what a provider published.
 *
 * Providers do not agree on how to spell anything. The 32 records in this data
 * set publish 157 distinct course strings and 47 distinct year-level strings for
 * what are, between them, a few dozen actual programmes and cohorts: "BS
 * Computer Science", "Computer Science" and "Computer Science / Technology" are
 * one programme; "1st Year College", "Incoming Freshman" and "Any College Year
 * Level" describe overlapping cohorts.
 *
 * Exact string equality against those lists is not merely lossy, it is unsafe:
 * it resolves a spelling difference to Requirement Not Met and rules the student
 * out of a programme they qualify for. That is the failure AGENTS.md §3 exists to
 * prevent, so every comparison here is built to fall to `unknown` rather than to
 * `not-met` whenever the published text cannot be resolved confidently.
 *
 * Nothing in this module is a model call. It is string arithmetic over published
 * text, and every rule is inspectable and tested.
 */

import type { CheckState } from "./matching";

/* ── Courses ──────────────────────────────────────────────── */

/**
 * Degree prefixes, expanded rather than dropped where the expansion carries
 * meaning. "BSEd major in Science" and "BS Secondary Education – Science" name
 * the same programme, and only survive as the same token set if `bsed` becomes
 * the words it abbreviates.
 */
const DEGREE_EXPANSIONS: [pattern: RegExp, expansion: string][] = [
  [/^bachelor of science in\s+/, ""],
  [/^bachelor of arts in\s+/, ""],
  [/^bachelor of\s+/, ""],
  [/^bsba\b\s*/, "business administration "],
  [/^bsed\b\s*/, "secondary education "],
  [/^bseed\b\s*/, "elementary education "],
  [/^bted\b\s*/, "technical education "],
  [/^bited\b\s*/, "computer education "],
  [/^btvted\b\s*/, "technical vocational teacher education "],
  [/^bs\b\s*/, ""],
  [/^ab\b\s*/, ""],
  [/^ba\b\s*/, ""],
];

/** Words that carry no distinguishing meaning in a programme name. */
const COURSE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "course",
  "courses",
  "degree",
  "degrees",
  "for",
  "in",
  "major",
  "majoring",
  "of",
  "or",
  "program",
  "programme",
  "programmes",
  "programs",
  "the",
  "track",
  "tracks",
  "with",
]);

/**
 * Published entries that place no restriction on the programme at all — "Any
 * first undergraduate degree in a CHED-recognized institution" is an eligibility
 * criterion satisfied by every course, and comparing it as a literal string
 * fails every student who does not type that sentence.
 */
const OPEN_TO_ANY_COURSE = [
  /\bany\b.*\b(undergraduate|degree|course|program)/i,
  /\ball\b.*\b(undergraduate|degree|course|program)/i,
  /\b(four|five|4|5)[- ]year\b.*\b(baccalaureate|degree|course)/i,
  /\bbaccalaureate\b.*\bcourse/i,
  /\bbachelor'?s degree (course|program)/i,
  /\bassociate course\b/i,
  /\bcollege degree program/i,
];

/**
 * Published entries too general to decide either way — a priority list the
 * office may look past, or a note that the courses are set elsewhere. These
 * resolve to Unknown, never to Not Met.
 */
const VAGUE_COURSE = [
  /\bpriority\b/i,
  /\bvar(y|ies)\b/i,
  /\bspecific courses\b/i,
  /\brelevant\b/i,
  /\bsimilar\b/i,
  /\brelated\b/i,
];

/** Lowercase, expand the degree prefix, drop punctuation and stopwords. */
export function courseTokens(value: string): Set<string> {
  let text = value
    .toLowerCase()
    .replace(/[‐-―]/g, " ") // dashes of every width
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, expansion] of DEGREE_EXPANSIONS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, expansion).trim();
      break;
    }
  }

  return new Set(
    text
      .split(" ")
      .filter((token) => token.length > 0 && !COURSE_STOPWORDS.has(token))
  );
}

function isSubset(small: Set<string>, large: Set<string>): boolean {
  for (const token of small) if (!large.has(token)) return false;
  return true;
}

/**
 * Whether two programme names describe the same programme.
 *
 * Equal token sets match. A subset matches only when the smaller set has at
 * least two tokens: {education} sits inside {agricultural, education} without
 * being the same programme, whereas {elementary, education} inside {elementary,
 * general, education, stem, specialization} genuinely is.
 */
export function sameCourse(a: string, b: string): boolean {
  const left = courseTokens(a);
  const right = courseTokens(b);
  if (left.size === 0 || right.size === 0) return false;

  if (left.size === right.size) return isSubset(left, right);

  const [small, large] = left.size < right.size ? [left, right] : [right, left];
  return small.size >= 2 && isSubset(small, large);
}

export interface CourseVerdict {
  state: CheckState;
  /** The published entry that decided it, when one did. */
  matched: string | null;
  /** True when the published list places no restriction on the programme. */
  openToAny: boolean;
}

/**
 * Resolve a student's course against a published eligible-course list.
 *
 * Order matters: an open list is satisfied by any programme, so it is checked
 * before any comparison; and a vague list can only ever reach Unknown, so it can
 * never sink a student to Not Met on a spelling difference.
 */
export function matchCourse(published: string[], course: string): CourseVerdict {
  const trimmed = course.trim();
  const open = published.find((entry) =>
    OPEN_TO_ANY_COURSE.some((pattern) => pattern.test(entry))
  );

  if (open) {
    return {
      state: trimmed ? "met" : "unknown",
      matched: open,
      openToAny: true,
    };
  }

  if (!trimmed) return { state: "unknown", matched: null, openToAny: false };

  const hit = published.find((entry) => sameCourse(entry, trimmed));
  if (hit) return { state: "met", matched: hit, openToAny: false };

  const vague = published.some((entry) =>
    VAGUE_COURSE.some((pattern) => pattern.test(entry))
  );
  if (vague) return { state: "unknown", matched: null, openToAny: false };

  return { state: "not-met", matched: null, openToAny: false };
}

/* ── Year levels and cohorts ──────────────────────────────── */

/**
 * The cohort a requirement is about, reduced to tokens both sides can produce.
 * `college` without a number means any college year, which is how a large share
 * of published entries are phrased.
 */
export type CohortToken =
  | "grade-12"
  | "shs-grad"
  | "incoming-college"
  | "college"
  | "college-1"
  | "college-2"
  | "college-3"
  | "college-4"
  | "college-5"
  | "graduate"
  | "basic-ed";

const YEAR_TO_TOKEN: Record<string, CohortToken> = {
  "1st Year": "college-1",
  "2nd Year": "college-2",
  "3rd Year": "college-3",
  "4th Year": "college-4",
  "5th Year": "college-5",
};

/**
 * The cohorts a profile belongs to.
 *
 * Empty means we cannot place the student — a student still planning to study
 * has no cohort yet, and that must read as Unknown rather than as failing every
 * cohort requirement.
 */
export function profileCohorts(stage: string, year: string): Set<CohortToken> {
  const tokens = new Set<CohortToken>();

  switch (stage.trim()) {
    case "Grade 12":
      tokens.add("grade-12");
      tokens.add("shs-grad");
      tokens.add("incoming-college");
      break;
    case "Incoming College":
      tokens.add("shs-grad");
      tokens.add("incoming-college");
      break;
    case "College Student": {
      tokens.add("college");
      const mapped = YEAR_TO_TOKEN[year.trim()];
      if (mapped) tokens.add(mapped);
      break;
    }
    case "Graduate Student":
      tokens.add("graduate");
      break;
    default:
      /* "Still planning to study", or no answer at all. Both are Unknown. */
      break;
  }

  return tokens;
}

/**
 * The cohorts a published year-level string refers to. An empty set means the
 * text could not be resolved, which is materially different from "no cohort
 * qualifies" — the caller treats it as Unknown.
 */
export function publishedCohorts(entry: string): Set<CohortToken> {
  const text = entry.toLowerCase();
  const tokens = new Set<CohortToken>();

  /* Any-college phrasings. Checked first: "Currently Enrolled College Student"
     must not be read as a specific year by the rules below. */
  if (
    /any college year|any year level|college undergraduate|currently enrolled college|ongoing college|college student/.test(
      text
    ) &&
    !/\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth)\b/.test(text)
  ) {
    tokens.add("college");
  }

  if (/grade 6|grade 7/.test(text)) tokens.add("basic-ed");

  if (/graduate student|master'?s|doctor|medical (student|school)/.test(text)) {
    tokens.add("graduate");
  }

  /* Senior-high and equivalent exits. "Grade 12 graduate not yet enrolled" is a
     school leaver, so it also carries the incoming-college cohort. */
  if (
    /grade 12|graduating shs|graduating senior high|senior high school graduate|shs graduate|high school graduate|\bals\b/.test(
      text
    )
  ) {
    tokens.add("shs-grad");
    if (/graduating grade 12|grade 12$|^graduating/.test(text)) tokens.add("grade-12");
    if (/not yet enrolled|graduate|completer|certificate/.test(text)) {
      tokens.add("incoming-college");
    }
  }

  const incoming = /incoming|new undergraduate applicant|applicant/.test(text);

  /* Year ranges, e.g. "2nd-5th Year College". */
  const range = text.match(/(\d)(?:st|nd|rd|th)?\s*[-–—to]+\s*(\d)(?:st|nd|rd|th)?\s*year/);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    for (let n = from; n <= to && n <= 5; n++) {
      if (n >= 1) tokens.add(`college-${n}` as CohortToken);
    }
  } else {
    const ordinals: [RegExp, number][] = [
      [/\b(1st|first|freshman)\b/, 1],
      [/\b(2nd|second|sophomore)\b/, 2],
      [/\b(3rd|third|junior)\b/, 3],
      [/\b(4th|fourth|senior)\b/, 4],
      [/\b(5th|fifth)\b/, 5],
    ];
    for (const [pattern, n] of ordinals) {
      if (!pattern.test(text)) continue;
      /* "Incoming 1st Year" is not yet in college — it is a school leaver about
         to enrol. Any later incoming year is a continuing student. */
      if (incoming && n === 1) tokens.add("incoming-college");
      else tokens.add(`college-${n}` as CohortToken);
    }
    /* "Incoming College Student" with no ordinal at all. */
    if (incoming && tokens.size === 0) tokens.add("incoming-college");
    /* "Incoming 4th Year in a 5-year program" mentions a 5-year programme
       without being about 5th years; the ordinal loop already added college-4
       and college-5, which is the honest reading of an ambiguous entry. */
  }

  return tokens;
}

export interface CohortVerdict {
  state: CheckState;
  matched: string | null;
}

/**
 * Resolve a profile's cohort against a published year-level list.
 *
 * Falls to Unknown in both directions: when the student has no placeable stage,
 * and when a published entry ("Varies by scholarship track", "Continuing
 * Grantee") cannot be resolved to a cohort at all.
 */
export function matchCohort(
  published: string[],
  stage: string,
  year: string
): CohortVerdict {
  const mine = profileCohorts(stage, year);
  if (mine.size === 0) return { state: "unknown", matched: null };

  let anyUnresolved = false;
  for (const entry of published) {
    const theirs = publishedCohorts(entry);
    if (theirs.size === 0) {
      anyUnresolved = true;
      continue;
    }
    for (const token of theirs) {
      if (mine.has(token)) return { state: "met", matched: entry };
    }
  }

  return { state: anyUnresolved ? "unknown" : "not-met", matched: null };
}
