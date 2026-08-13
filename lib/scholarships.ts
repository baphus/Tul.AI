/**
 * Domain model for Tul.AI.
 *
 * Data transcribed 1:1 from the AIskolehiyo.html design prototype. Every scholarship
 * carries a deterministic `met`/`total` requirement count so the UI can render
 * an explainable requirement metric ("x of y requirements met · %") without
 * ever fabricating a confidence score. `getScholarships()` is the swap seam:
 * replace its body with an API/Supabase fetch later without touching clients.
 */

import rawScholarships from "@/data/scholarships.json";

export type RequirementState = "ok" | "warn" | "none";

export interface RequirementRow {
  state: RequirementState;
  label: string;
  text: string;
}

export interface WhyMatch {
  state: RequirementState;
  label: string;
}

export interface Source {
  name: string;
  /** Canonical source URL; citations and redirects always point to the provider. */
  url: string;
  date: string;
  short: string;
}

export type MatchTone = "strong" | "good" | "possible";
export type ScholarshipKind = "national" | "lgu" | "university";

export interface BackFacts {
  about: string;
  facts: [string, string][];
}

/**
 * Verification state (AGENTS.md §3 / PRD §31). Every record carries one, plus
 * the date it was last checked. `Needs Verification` means the information
 * exists but something material could not be confirmed — it is not a warning
 * about the student's eligibility.
 */
export type VerificationStatus =
  | "Verified"
  | "Needs Verification"
  | "Expired"
  | "Updated"
  | "Unknown";

/**
 * Published, structured eligibility criteria (PRD §16, AGENTS.md §6).
 *
 * Every field is optional because most programmes publish only some of these.
 * An omitted dimension means the programme publishes no requirement for it —
 * there is nothing to check, so the matching engine never guesses one into
 * existence. This structure is the only input the deterministic eligibility
 * engine reads (lib/logic/matching.ts); the free-text `why`/`rows` demo copy
 * is presentation, never the source of a match decision.
 */
export interface Eligibility {
  /** Minimum GWA on the 60–100 scale. Omitted = no published minimum. */
  gwaMin?: number;
  /** Student stages accepted (see STAGE_OPTS). */
  stages?: string[];
  /** Year levels accepted (see YEARS). */
  years?: string[];
  /** Courses/programmes this cycle is open to. */
  courses?: string[];
  /**
   * What `courses` means. `published` — the list is a hard restriction (Not
   * Met when absent). `priority` — the office may still accept outside the
   * list, so an absent course resolves Unknown, never Not Met.
   */
  courseMode?: "published" | "priority";
  /** Locations the student must be from / study in (see LOCATIONS). */
  locations?: string[];
  /** Maximum monthly household income. Omitted = not need-limited. */
  incomeMax?: number;
  /** Special circumstances that qualify (see CHIPS). */
  special?: string[];
  /** School the student must be enrolled at. */
  school?: string;
}

export interface Scholarship {
  id: string;
  provider: string;
  /**
   * The provider's own crest, as published with the record. `null` when the
   * record carries none — which must render as a monogram, never as another
   * provider's logo. Attributing CHED's crest to a private foundation is a
   * source-integrity failure, not a cosmetic one (AGENTS.md §5).
   */
  logo: string | null;
  title: string;
  amount: number;
  amountNote: string;
  /** Display form, e.g. "Aug. 30, 2026". */
  deadline: string;
  /** Machine form for day arithmetic — "days left" is always computed, never stored. */
  deadlineIso: string;
  match: "Strong match" | "Good match" | "Possible match";
  matchShort: string;
  tone: MatchTone;
  met: number;
  total: number;
  why: WhyMatch[];
  rows: RequirementRow[];
  needs: string[];
  sources: Source[];
  host: string;
  /** Exact provider-owned destination for the explicit application hand-off. */
  applicationUrl: string | null;
  verify: string;
  kind: ScholarshipKind;
  /** Structured criteria the eligibility engine reads (PRD §16). */
  eligibility: Eligibility;
  back: BackFacts;
  /** Trust metadata — never omit these on a new record. */
  verification: VerificationStatus;
  /** ISO date of the last successful source check. */
  lastVerified: string;
  /** Highest source tier backing this record (1 = official provider). */
  sourceTier: 1 | 2 | 3 | 4;
}

type RawScholarship = {
  id: number; name: string; provider: string; provider_type?: string | null;
  description?: string | null; benefits?: { items?: unknown } | null;
  application_url?: string | null; official_url?: string | null; deadline?: string | null;
  status?: string | null; eligible_courses?: unknown; eligible_year_levels?: unknown;
  minimum_gwa?: number | null; income_requirements?: Record<string, unknown> | null;
  geographic_requirements?: Record<string, unknown> | null; special_categories?: unknown;
  required_documents?: unknown; source_urls?: unknown; last_verified_at?: string | null;
  verification_status?: string | null; logo_url?: string | null;
};

const rawRecords = rawScholarships as RawScholarship[];

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
function dateOnly(value: string | null | undefined): string { return value ? value.slice(0, 10) : ""; }
function displayDate(value: string | null | undefined): string {
  const iso = dateOnly(value);
  if (!iso) return "No published deadline";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}
function sourceHost(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return fallback; }
}
function sourceName(url: string, provider: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return provider; }
}
/**
 * The provider crest, served from the repo rather than the remote host the raw
 * record points at.
 *
 * `data/scholarships.json` carries absolute Cloudinary URLs; all 26 of those
 * files now live in `public/logos/providers/` under the same basename, so the
 * mapping is derived rather than tabulated — nothing to keep in sync when a
 * record is added, beyond dropping the file in. Self-hosting also means no
 * third-party request on first paint and no remote image host to allow in
 * next.config.ts.
 *
 * Returns null when the record publishes no crest, which renders as a monogram.
 */
function providerLogo(record: RawScholarship): string | null {
  if (!record.logo_url) return null;
  const basename = record.logo_url.split("/").pop();
  return basename ? `/logos/providers/${basename}` : null;
}
function benefitAmount(record: RawScholarship): number {
  const text = strings(record.benefits?.items).join(" ");
  const values = [...text.matchAll(/[₱]\s*([0-9,]+)/g)].map((match) => Number(match[1].replace(/,/g, "")));
  return values.length ? Math.max(...values) : 0;
}
function locations(record: RawScholarship): string[] | undefined {
  const geo = record.geographic_requirements ?? {};
  const values = [geo.locations, geo.cities, geo.provinces, geo.scope].flatMap(strings);
  if (values.some((value) => value.toLowerCase().includes("nationwide"))) return undefined;
  return values.length ? values : undefined;
}
function incomeMax(record: RawScholarship): number | undefined {
  const income = record.income_requirements ?? {};
  const monthly = income.max_monthly_income_php;
  if (typeof monthly === "number") return monthly;
  const annual = income.max_annual_gross_family_income_php;
  return typeof annual === "number" ? Math.round(annual / 12) : undefined;
}
function verificationStatus(record: RawScholarship): VerificationStatus {
  const raw = (record.verification_status ?? "").toUpperCase();
  const status = record.status?.toUpperCase() ?? "";
  if (status.includes("CLOSED") || raw.includes("CLOSED")) return "Expired";
  if (raw === "VERIFIED" || raw.startsWith("VERIFIED_")) return "Verified";
  if (raw.includes("UPDATED")) return "Updated";
  return "Needs Verification";
}
function sourceTier(record: RawScholarship): 1 | 2 | 3 | 4 {
  const url = record.official_url ?? "";
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith(".gov.ph") || host.endsWith(".edu.ph") || host.includes("foundation") || host.includes("scholarship")) return 1;
    return url ? 3 : 4;
  } catch { return 4; }
}
function kindFor(record: RawScholarship): ScholarshipKind {
  const type = (record.provider_type ?? "").toLowerCase();
  if (type.includes("university") || type.includes("school")) return "university";
  if (type.includes("lgu") || type.includes("local")) return "lgu";
  return "national";
}
function criteriaFor(record: RawScholarship): Eligibility {
  const courses = strings(record.eligible_courses);
  const years = strings(record.eligible_year_levels);
  return {
    gwaMin: typeof record.minimum_gwa === "number" ? record.minimum_gwa : undefined,
    courses: courses.length ? courses : undefined, courseMode: courses.length ? "published" : undefined,
    years: years.length ? years : undefined, locations: locations(record), incomeMax: incomeMax(record),
    special: strings(record.special_categories),
  };
}
function rowsFor(criteria: Eligibility): RequirementRow[] {
  const rows: RequirementRow[] = [];
  if (criteria.gwaMin !== undefined) rows.push({ state: "none", label: "GWA", text: "Published minimum: " + criteria.gwaMin + "%." });
  if (criteria.courses?.length) rows.push({ state: "none", label: "Course", text: "Published eligible courses include " + criteria.courses.slice(0, 4).join(", ") + "." });
  if (criteria.years?.length) rows.push({ state: "none", label: "Year level", text: "Published eligible year levels include " + criteria.years.join(", ") + "." });
  if (criteria.locations?.length) rows.push({ state: "none", label: "Location", text: "Published location scope: " + criteria.locations.join(", ") + "." });
  if (criteria.incomeMax !== undefined) rows.push({ state: "none", label: "Household income", text: "Published monthly income ceiling: ₱" + criteria.incomeMax.toLocaleString("en-PH") + "." });
  if (criteria.special?.length) rows.push({ state: "none", label: "Special circumstances", text: "Published categories include " + criteria.special.slice(0, 4).join(", ") + "." });
  return rows.length ? rows : [{ state: "none", label: "Published criteria", text: "The provider has not published enough structured criteria for an automatic comparison." }];
}
function adapt(record: RawScholarship): Scholarship {
  const eligibility = criteriaFor(record); const rows = rowsFor(eligibility); const urls = strings(record.source_urls);
  const lastVerified = dateOnly(record.last_verified_at) || "Unknown"; const verification = verificationStatus(record);
  const amount = benefitAmount(record); const deadlineIso = dateOnly(record.deadline) || "9999-12-31";
  return {
    id: String(record.id), provider: record.provider, logo: providerLogo(record), title: record.name, amount,
    amountNote: amount ? "published benefit" : "see provider details", deadline: displayDate(record.deadline), deadlineIso,
    match: "Possible match", matchShort: "Review " + rows.length + " published requirement" + (rows.length === 1 ? "" : "s"),
    tone: "possible", met: 0, total: rows.length,
    why: rows.slice(0, 3).map((row) => ({ state: row.state, label: row.label + " published" })), rows,
    needs: strings(record.required_documents).length ? strings(record.required_documents) : ["Check the provider's official application instructions"],
    sources: urls.length ? urls.map((url) => ({ name: sourceName(url, record.provider), url, date: "Checked " + lastVerified, short: lastVerified.slice(5) })) : [{ name: record.provider, url: record.official_url ?? record.application_url ?? "", date: "Checked " + lastVerified, short: lastVerified.slice(5) }],
    host: sourceHost(record.application_url || record.official_url, record.provider), applicationUrl: record.application_url ?? record.official_url ?? null,
    verify: record.description ?? "Review the provider's official source for current details.", kind: kindFor(record), eligibility,
    back: { about: record.description ?? "No description published.", facts: [["Provider type", record.provider_type ?? "Not published"], ["Status", record.status ?? "Not published"], ["Source count", String(urls.length)]] },
    verification, lastVerified, sourceTier: sourceTier(record),
  };
}
export const DATA: Scholarship[] = rawRecords.map(adapt);

export const THEME: { h: number; s: number }[] = [
  { h: 222, s: 42 },
  { h: 196, s: 78 },
  { h: 240, s: 40 },
  { h: 52, s: 62 },
  { h: 22, s: 58 },
  { h: 44, s: 55 },
];

export const LOGOS = [
  "/logos/ched.webp",
  "/logos/dost.png",
  "/logos/owwa.png",
  "/logos/cebu-city.png",
  "/logos/ctu.png",
  "/logos/cebu-province.png",
];

export const KIND: ScholarshipKind[] = DATA.map((card) => card.kind);

export const STAGE_LABELS = [
  "Understanding your profile",
  "Checking academic requirements",
  "Comparing financial-aid programs",
  "Checking location requirements",
  "Looking for opportunities you may have missed",
];

export const SOURCE_LABELS = [
  "CHED",
  "DOST-SEI",
  "OWWA",
  "Cebu scholarship programs",
  "University scholarship portals",
];

export const VERIFY_LABELS = [
  "Official provider website",
  "Current application notice",
  "Published requirements",
  "Application deadline",
];

export const INCOMES = [
  "Below ₱10,000",
  "₱10,000–₱20,000",
  "₱20,000–₱30,000",
  "₱30,000–₱50,000",
  "Above ₱50,000",
  "Prefer not to say",
];

/**
 * Circumstances that unlock specific programmes. Optional and sensitive
 * (AGENTS.md §9) — a student may disclose none of them and lose nothing.
 */
export const CIRCUMSTANCE_CHIPS = [
  "4Ps household",
  "OFW parent",
  "Solo-parent household",
  "PWD",
  "Indigenous community",
];

/**
 * "None" and "Prefer not to say" are answers *about* the list rather than
 * entries in it, so they are exclusive: picking either clears every other
 * selection, and picking a circumstance clears them.
 *
 * They are not interchangeable. "None" is evidence — the student told us no
 * listed circumstance applies — and resolves a category requirement to Not Met.
 * "Prefer not to say" is the absence of evidence and resolves to Unknown. See
 * `specialCheck` in lib/logic/matching.ts (spec §2.3).
 *
 * The stored value of "None" stays the bare string it has always been so that
 * profiles already in localStorage keep their answer; only the label changed.
 */
export const CHIP_NONE = "None";
export const CHIP_WITHHELD = "Prefer not to say";
export const CHIP_EXCLUSIVE = [CHIP_NONE, CHIP_WITHHELD];

export const CHIPS = [...CIRCUMSTANCE_CHIPS, ...CHIP_EXCLUSIVE];

const CHIP_LABELS: Record<string, string> = {
  [CHIP_NONE]: "None of these apply",
};

/** What a chip reads as on screen, which can differ from what we store. */
export function chipLabel(value: string): string {
  return CHIP_LABELS[value] ?? value;
}

/**
 * A student who has not committed to a school yet — someone securing funding
 * before they enrol. They are asked no question that presumes enrolment, and
 * every cohort requirement resolves Unknown for them rather than Not Met.
 */
export const PLANNING = "Still planning to study";

export const STAGE_OPTS = [
  "Grade 12",
  "Incoming College",
  "College Student",
  "Graduate Student",
  PLANNING,
];

/** What each stage means, shown under the option on step 1. */
export const STAGE_NOTES: Record<string, string> = {
  "Grade 12": "Finishing senior high and looking ahead to college",
  "Incoming College": "Accepted or enrolling, but classes haven't started",
  "College Student": "Currently enrolled in an undergraduate programme",
  "Graduate Student": "Taking a master's, doctorate or professional degree",
  [PLANNING]: "Securing funding first — no school decided yet",
};

export const CITIES = [
  "Cebu City",
  "Mandaue City",
  "Lapu-Lapu City",
  "Talisay City",
  "Toledo City",
];

/**
 * The first onboarding question. Coverage is Cebu-first in the MVP, so the
 * options say so plainly rather than implying nationwide coverage.
 */
export const LOCATIONS: { value: string; label: string; note: string }[] = [
  { value: "Cebu City", label: "Cebu City", note: "Best covered — city, provincial and university programs" },
  { value: "Elsewhere in Cebu", label: "Elsewhere in Cebu", note: "Provincial and national programs" },
  { value: "Metro Manila", label: "Metro Manila", note: "National programs for now" },
  { value: "Davao", label: "Davao", note: "National programs for now" },
  { value: "Somewhere else", label: "Somewhere else", note: "Tell us where and we'll match national programs" },
];

/** Common programs, offered as quick picks on the "what are you studying" step. */
export const COURSE_SUGGESTIONS = [
  "BS Nursing",
  "BS Information Systems",
  "BS Computer Science",
  "BS Education",
  "BS Civil Engineering",
  "BS Accountancy",
];

export const DEPENDENT_HINT = "Including yourself, how many people depend on that income?";

/** Five, because Architecture and several engineering programmes run five years. */
export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

/**
 * Openers for the free-text step (spec §2.4).
 *
 * Two kinds, and the distinction is a privacy requirement rather than a style
 * choice. A message whose meaning is already modelled as a structured field sets
 * that field (`chip`) instead of writing sensitive prose we would then have to
 * store, justify and delete — AGENTS.md §9 prefers the reviewed structured field
 * over the paragraph. Only genuinely unstructured context reaches `notes`.
 */
export interface QuickNote {
  label: string;
  /** Sets this circumstance chip instead of appending text. */
  chip?: string;
  /** Appended to the notes field, in the student's own voice. */
  text?: string;
}

export const QUICK_NOTES: QuickNote[] = [
  { label: "One of my parents works overseas", chip: "OFW parent" },
  { label: "We're a 4Ps household", chip: "4Ps household" },
  { label: "I'm from a solo-parent household", chip: "Solo-parent household" },
  {
    label: "I'm the first in my family to go to college",
    text: "I'm the first in my family to go to college.",
  },
  {
    label: "I'm working while studying",
    text: "I'm working while studying, so I need something that fits around a job.",
  },
  {
    label: "I need allowance, not just tuition",
    text: "Tuition is only part of the problem — I need help with allowance, transport and books too.",
  },
  {
    label: "I had to stop studying for a while",
    text: "I had to stop studying for a while and I'm returning now.",
  },
  {
    label: "I'm planning to shift courses",
    text: "I'm planning to shift courses, so I'm open to programmes tied to a different field.",
  },
];

export const BRAND = "oklch(0.5 0.12 200)";
export const BRAND_DARK = "oklch(0.66 0.11 200)";
export const OK = "oklch(0.55 0.12 155)";
export const WARN = "oklch(0.66 0.13 80)";
export const GREY = "oklch(0.78 0.012 230)";

/*
 * Cycles rather than clamps. `Math.min(index, length - 1)` gave every record
 * past the sixth the same hue, which with a 32-record data set meant 27 of them
 * shared one tint.
 */
export function providerHue(index: number) {
  return THEME[index % THEME.length];
}

export function scholarshipLogo(index: number) {
  return LOGOS[Math.min(index, LOGOS.length - 1)];
}

export function scholarshipByIndex(index: number) {
  return DATA[Math.min(index, DATA.length - 1)];
}

export function scholarshipById(id: string): Scholarship | undefined {
  return DATA.find((s) => s.id === id);
}

/** Swap seam: replace with an API/Supabase fetch to go live. */
export async function getScholarships(): Promise<Scholarship[]> {
  return DATA;
}
