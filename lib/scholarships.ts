/**
 * Domain model for Tul.AI.
 *
 * Data transcribed 1:1 from the AIskolehiyo.html design prototype. Every scholarship
 * carries a deterministic `met`/`total` requirement count so the UI can render
 * an explainable requirement metric ("x of y requirements met · %") without
 * ever fabricating a confidence score. `getScholarships()` is the swap seam:
 * replace its body with an API/Supabase fetch later without touching clients.
 */

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

export interface Scholarship {
  id: string;
  provider: string;
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
  verify: string;
  kind: ScholarshipKind;
  back: BackFacts;
  /** Trust metadata — never omit these on a new record. */
  verification: VerificationStatus;
  /** ISO date of the last successful source check. */
  lastVerified: string;
  /** Highest source tier backing this record (1 = official provider). */
  sourceTier: 1 | 2 | 3 | 4;
}

export const DATA: Scholarship[] = [
  {
    id: "ched-merit-scholarship",
    provider: "CHED",
    title: "Merit Scholarship Program",
    amount: 60000,
    amountNote: "per academic year",
    deadline: "Aug. 30, 2026",
    deadlineIso: "2026-08-30",
    match: "Strong match",
    matchShort: "8 of 9 requirements met",
    tone: "strong",
    met: 8,
    total: 9,
    why: [
      { state: "ok", label: "GWA requirement met" },
      { state: "ok", label: "Course requirement met" },
      { state: "ok", label: "Student category matched" },
    ],
    rows: [
      { state: "ok", label: "GWA", text: "Your 94.5% meets the published requirement." },
      { state: "ok", label: "Course", text: "Your program is listed as eligible." },
      { state: "ok", label: "Location", text: "Your location matches the program’s requirement." },
      { state: "ok", label: "Student status", text: "Your current year level matches." },
      { state: "warn", label: "Documentation", text: "You may need additional income documentation." },
    ],
    needs: ["PSA birth certificate", "Grade records", "Enrollment document", "Income documentation"],
    sources: [
      { name: "CHED Official Website", date: "Verified Aug. 11, 2026", short: "Aug 11" },
      { name: "CHED Scholarship Memorandum", date: "Verified Aug. 11, 2026", short: "Aug 11" },
    ],
    host: "ched.gov.ph",
    verification: "Verified",
    lastVerified: "2026-08-11",
    sourceTier: 1,
    verify:
      "The program is currently open and the published deadline has not changed. The academic requirement still matches your GWA. One item is unclear: the income documentation list was updated this year, so bring both an income certificate and the latest tax exemption form if you have one.",
    kind: "national",
    back: {
      about:
        "A nationwide merit program for students entering or continuing a four-year degree at a recognised institution. Awards are released per semester through the student’s school.",
      facts: [
        ["Who it’s for", "Full-time undergraduates with strong academic standing"],
        ["Coverage", "Tuition support plus a book and living allowance"],
        ["Renewal", "Reviewed every semester against your grades"],
        ["Selection", "Ranked nationally, then allocated per region"],
      ],
    },
  },
  {
    id: "dost-sei-undergraduate-scholarship",
    provider: "DOST-SEI",
    title: "Undergraduate S&T Scholarship",
    amount: 40000,
    amountNote: "per semester",
    deadline: "Sept. 15, 2026",
    deadlineIso: "2026-09-15",
    match: "Strong match",
    matchShort: "7 of 8 requirements met",
    tone: "strong",
    met: 7,
    total: 8,
    why: [
      { state: "ok", label: "Science & technology course" },
      { state: "ok", label: "Academic standing met" },
      { state: "ok", label: "Filipino citizenship" },
    ],
    rows: [
      { state: "ok", label: "Course", text: "Information Systems falls under the priority S&T fields." },
      { state: "ok", label: "GWA", text: "Your 94.5% is above the published academic cut-off." },
      { state: "ok", label: "Year level", text: "First-year applicants are accepted for this cycle." },
      { state: "warn", label: "Qualifying exam", text: "You still need to sit the scholarship examination." },
    ],
    needs: [
      "PSA birth certificate",
      "Certificate of good moral character",
      "Form 138 / grade records",
      "Certificate of indigency (optional)",
    ],
    sources: [
      { name: "DOST-SEI Official Website", date: "Verified Aug. 11, 2026", short: "Aug 11" },
      { name: "DOST-SEI Application Notice", date: "Verified Aug. 10, 2026", short: "Aug 10" },
    ],
    host: "sei.dost.gov.ph",
    verification: "Verified",
    lastVerified: "2026-08-11",
    sourceTier: 1,
    verify:
      "Applications for this cycle are open. The qualifying examination schedule for Region VII was published last week, and the nearest testing centre is in Cebu City. Everything else in your profile still lines up with the published criteria.",
    kind: "national",
    back: {
      about:
        "A science and technology scholarship for students in priority fields. Applicants sit a qualifying examination before the award is granted.",
      facts: [
        ["Who it’s for", "Students in priority S&T degree programs"],
        ["Coverage", "Tuition, monthly stipend, book and transport allowance"],
        ["Renewal", "Continuous, subject to academic performance"],
        ["Selection", "Qualifying exam plus academic record"],
      ],
    },
  },
  {
    id: "owwa-education-for-dependents",
    provider: "OWWA",
    title: "Education for Dependents of OFWs",
    amount: 30000,
    amountNote: "per academic year",
    deadline: "Aug. 28, 2026",
    deadlineIso: "2026-08-28",
    match: "Possible match",
    matchShort: "5 of 8 requirements met",
    tone: "possible",
    met: 5,
    total: 8,
    why: [
      { state: "ok", label: "Household context matched" },
      { state: "ok", label: "Enrolled in a state university" },
      { state: "warn", label: "Membership needs checking" },
    ],
    rows: [
      { state: "ok", label: "Household context", text: "You indicated an OFW parent in your profile." },
      { state: "ok", label: "School", text: "State universities are covered by this program." },
      { state: "warn", label: "Membership", text: "The parent’s OWWA membership must be active at the time of application." },
      { state: "none", label: "Slots", text: "The provider has not published the slot allocation for this cycle." },
    ],
    needs: ["Proof of OWWA membership", "PSA birth certificate", "Certificate of enrollment", "Grade records"],
    sources: [{ name: "OWWA Official Website", date: "Verified Aug. 11, 2026", short: "Aug 11" }],
    host: "owwa.gov.ph",
    verification: "Needs Verification",
    lastVerified: "2026-08-11",
    sourceTier: 1,
    verify:
      "The program page is live, but the slot allocation for this cycle has not been published yet. Membership status is the deciding factor here, so it is worth confirming with the regional office before preparing the rest of the documents.",
    kind: "national",
    back: {
      about:
        "An education benefit for the children and dependents of overseas Filipino workers, administered through the regional welfare office.",
      facts: [
        ["Who it’s for", "Dependents of active member OFWs"],
        ["Coverage", "Annual education assistance paid per school year"],
        ["Renewal", "Requires proof of continued membership"],
        ["Selection", "Slot-based, allocated per region"],
      ],
    },
  },
  {
    id: "cebu-city-higher-education-assistance",
    provider: "Cebu City Government",
    title: "Higher Education Assistance",
    amount: 20000,
    amountNote: "per semester",
    deadline: "Aug. 22, 2026",
    deadlineIso: "2026-08-22",
    match: "Strong match",
    matchShort: "6 of 6 requirements met",
    tone: "strong",
    met: 6,
    total: 6,
    why: [
      { state: "ok", label: "Cebu City residency met" },
      { state: "ok", label: "Income bracket matched" },
      { state: "ok", label: "Enrolled locally" },
    ],
    rows: [
      { state: "ok", label: "Residency", text: "Your registered address is within Cebu City." },
      { state: "ok", label: "Income", text: "Your bracket falls within the published ceiling." },
      { state: "ok", label: "School", text: "Your university is on the accredited list." },
      { state: "ok", label: "Academic standing", text: "No failing grades is the only academic condition." },
    ],
    needs: ["Barangay certificate of residency", "Certificate of enrollment", "Grade records", "Income documentation"],
    sources: [{ name: "Cebu City Scholarship Office Notice", date: "Verified Aug. 11, 2026", short: "Aug 11" }],
    host: "cebucity.gov.ph",
    verification: "Verified",
    lastVerified: "2026-08-11",
    sourceTier: 2,
    verify:
      "The city scholarship office is accepting walk-in submissions until the published deadline. Residency and enrollment are the two documents they check first, so prepare those before anything else.",
    kind: "lgu",
    back: {
      about:
        "A city-funded assistance program for residents enrolled in accredited colleges and universities within Cebu City.",
      facts: [
        ["Who it’s for", "Registered Cebu City residents"],
        ["Coverage", "Cash assistance released per semester"],
        ["Renewal", "Re-applied each semester with updated grades"],
        ["Selection", "First-come, subject to residency verification"],
      ],
    },
  },
  {
    id: "ctu-academic-excellence-grant",
    provider: "Cebu Technological University",
    title: "Academic Excellence Grant",
    amount: 15000,
    amountNote: "per semester",
    deadline: "Sept. 5, 2026",
    deadlineIso: "2026-09-05",
    match: "Strong match",
    matchShort: "5 of 5 requirements met",
    tone: "strong",
    met: 5,
    total: 5,
    why: [
      { state: "ok", label: "Enrolled at CTU" },
      { state: "ok", label: "GWA above the cut-off" },
      { state: "ok", label: "Full academic load" },
    ],
    rows: [
      { state: "ok", label: "School", text: "You are enrolled at the granting university." },
      { state: "ok", label: "GWA", text: "Your 94.5% is above the published 90% cut-off." },
      { state: "ok", label: "Load", text: "A full academic load is required and your year level qualifies." },
    ],
    needs: ["Certificate of registration", "Grade records", "Application form from the registrar"],
    sources: [{ name: "CTU Scholarship Portal", date: "Verified Aug. 11, 2026", short: "Aug 11" }],
    host: "ctu.edu.ph",
    verification: "Verified",
    lastVerified: "2026-08-11",
    sourceTier: 1,
    verify:
      "The grant is administered per campus. The Cebu City campus published its own submission window, which closes earlier than the university-wide date, so treat the earlier date as your deadline.",
    kind: "university",
    back: {
      about:
        "A university-administered grant recognising students who maintain a high general weighted average across a full academic load.",
      facts: [
        ["Who it’s for", "Enrolled CTU students with a full load"],
        ["Coverage", "Partial tuition discount per semester"],
        ["Renewal", "Automatic while the GWA is maintained"],
        ["Selection", "Handled by each campus registrar"],
      ],
    },
  },
  {
    id: "province-of-cebu-provincial-scholarship",
    provider: "Province of Cebu",
    title: "Provincial Scholarship Program",
    amount: 12000,
    amountNote: "per semester",
    deadline: "Aug. 30, 2026",
    deadlineIso: "2026-08-30",
    match: "Possible match",
    matchShort: "4 of 7 requirements met",
    tone: "possible",
    met: 4,
    total: 7,
    why: [
      { state: "ok", label: "Provincial residency" },
      { state: "warn", label: "Priority course list" },
      { state: "none", label: "Income ceiling unpublished" },
    ],
    rows: [
      { state: "ok", label: "Residency", text: "Cebu residents across the province may apply." },
      { state: "warn", label: "Course", text: "Information Systems is not on this year’s published priority list." },
      { state: "none", label: "Income", text: "The provider has not published an income ceiling for this cycle." },
      { state: "ok", label: "Academic standing", text: "Your GWA is comfortably above the minimum." },
    ],
    needs: ["Barangay certificate", "Certificate of enrollment", "Grade records"],
    sources: [{ name: "Provincial Scholarship Notice", date: "Verified Aug. 9, 2026", short: "Aug 9" }],
    host: "cebu.gov.ph",
    verification: "Needs Verification",
    lastVerified: "2026-08-09",
    sourceTier: 2,
    verify:
      "The priority course list for this cycle is narrower than last year and does not currently include your program. The office may still accept applications under a general category, but that is not published, so treat this as unconfirmed.",
    kind: "lgu",
    back: {
      about:
        "A provincial program supporting students from across Cebu province, with priority given to a published list of courses each cycle.",
      facts: [
        ["Who it’s for", "Cebu province residents in any accredited school"],
        ["Coverage", "Semestral assistance, amount set per cycle"],
        ["Renewal", "Re-applied each cycle"],
        ["Selection", "Priority courses first, then general applicants"],
      ],
    },
  },
];

/** Hue/saturation sampled from each provider's logo. */
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

export const KIND: ScholarshipKind[] = [
  "national",
  "national",
  "national",
  "lgu",
  "university",
  "lgu",
];

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

export const CHIPS = [
  "4Ps household",
  "OFW parent",
  "Solo-parent household",
  "PWD",
  "Indigenous community",
  "None",
  "Prefer not to say",
];

export const STAGE_OPTS = [
  "Grade 12",
  "Incoming College",
  "College Student",
  "Graduate Student",
];

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

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const BRAND = "oklch(0.5 0.12 200)";
export const BRAND_DARK = "oklch(0.66 0.11 200)";
export const OK = "oklch(0.55 0.12 155)";
export const WARN = "oklch(0.66 0.13 80)";
export const GREY = "oklch(0.78 0.012 230)";

export function providerHue(index: number) {
  return THEME[Math.min(index, THEME.length - 1)];
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