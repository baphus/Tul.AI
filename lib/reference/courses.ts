/**
 * The course vocabulary a student picks from (spec §3.1).
 *
 * This is *input* vocabulary, not scholarship data: nothing here carries a
 * verification state or a source tier, and nothing here is a claim about any
 * provider. It exists so a student can name their programme without typing it,
 * and so the name they pick is one the eligibility engine can compare (see
 * `lib/logic/normalize.ts` — published course lists in the data set use 157
 * different spellings for these same programmes, so the comparison normalises
 * both sides rather than trusting either).
 *
 * Free text is always still accepted. An unlisted programme must never block a
 * student, so the field is an Autocomplete (free-form) rather than a Select.
 *
 * Clusters are the CHED-style discipline groupings, used only to group the
 * dropdown so a 120-item list stays scannable.
 */

export type CourseCluster =
  | "Engineering & Technology"
  | "Computing & Data"
  | "Health Sciences"
  | "Education"
  | "Business & Accountancy"
  | "Sciences & Mathematics"
  | "Agriculture, Fisheries & Environment"
  | "Arts, Humanities & Social Sciences"
  | "Maritime, Technical & Vocational";

export interface CourseOption {
  name: string;
  cluster: CourseCluster;
}

/**
 * Ordered by cluster, then alphabetically inside it. Names use the form a
 * Philippine student would recognise from their own enrolment record ("BS
 * Nursing", not "Bachelor of Science in Nursing"), because that is the form they
 * will scan for.
 */
export const COURSE_OPTIONS: CourseOption[] = [
  // ── Engineering & Technology ──
  { name: "BS Aerospace Engineering", cluster: "Engineering & Technology" },
  { name: "BS Agricultural & Biosystems Engineering", cluster: "Engineering & Technology" },
  { name: "BS Architecture", cluster: "Engineering & Technology" },
  { name: "BS Ceramics Engineering", cluster: "Engineering & Technology" },
  { name: "BS Chemical Engineering", cluster: "Engineering & Technology" },
  { name: "BS Civil Engineering", cluster: "Engineering & Technology" },
  { name: "BS Computer Engineering", cluster: "Engineering & Technology" },
  { name: "BS Electrical Engineering", cluster: "Engineering & Technology" },
  { name: "BS Electronics & Communications Engineering", cluster: "Engineering & Technology" },
  { name: "BS Environmental Engineering", cluster: "Engineering & Technology" },
  { name: "BS Geodetic Engineering", cluster: "Engineering & Technology" },
  { name: "BS Industrial Design", cluster: "Engineering & Technology" },
  { name: "BS Industrial Engineering", cluster: "Engineering & Technology" },
  { name: "BS Interior Design", cluster: "Engineering & Technology" },
  { name: "BS Materials Engineering", cluster: "Engineering & Technology" },
  { name: "BS Mechanical Engineering", cluster: "Engineering & Technology" },
  { name: "BS Metallurgical Engineering", cluster: "Engineering & Technology" },
  { name: "BS Mining Engineering", cluster: "Engineering & Technology" },
  { name: "BS Sanitary Engineering", cluster: "Engineering & Technology" },

  // ── Computing & Data ──
  { name: "BS Computer Science", cluster: "Computing & Data" },
  { name: "BS Data Science", cluster: "Computing & Data" },
  { name: "BS Entertainment & Multimedia Computing", cluster: "Computing & Data" },
  { name: "BS Information Systems", cluster: "Computing & Data" },
  { name: "BS Information Technology", cluster: "Computing & Data" },
  { name: "BS Library & Information Science", cluster: "Computing & Data" },
  { name: "BS Software Engineering", cluster: "Computing & Data" },

  // ── Health Sciences ──
  { name: "BS Dentistry", cluster: "Health Sciences" },
  { name: "BS Medical Laboratory Science", cluster: "Health Sciences" },
  { name: "BS Medical Technology", cluster: "Health Sciences" },
  { name: "BS Midwifery", cluster: "Health Sciences" },
  { name: "BS Nursing", cluster: "Health Sciences" },
  { name: "BS Nutrition and Dietetics", cluster: "Health Sciences" },
  { name: "BS Occupational Therapy", cluster: "Health Sciences" },
  { name: "BS Pharmacy", cluster: "Health Sciences" },
  { name: "BS Physical Therapy", cluster: "Health Sciences" },
  { name: "BS Public Health", cluster: "Health Sciences" },
  { name: "BS Radiologic Technology", cluster: "Health Sciences" },
  { name: "BS Respiratory Therapy", cluster: "Health Sciences" },
  { name: "BS Speech-Language Pathology", cluster: "Health Sciences" },
  { name: "Doctor of Medicine", cluster: "Health Sciences" },
  { name: "Doctor of Veterinary Medicine", cluster: "Health Sciences" },

  // ── Education ──
  { name: "BS Elementary Education", cluster: "Education" },
  { name: "BS Secondary Education – English", cluster: "Education" },
  { name: "BS Secondary Education – Filipino", cluster: "Education" },
  { name: "BS Secondary Education – Mathematics", cluster: "Education" },
  { name: "BS Secondary Education – Science", cluster: "Education" },
  { name: "BS Secondary Education – Social Studies", cluster: "Education" },
  { name: "BS Special Needs Education", cluster: "Education" },
  { name: "BS Technical-Vocational Teacher Education", cluster: "Education" },
  { name: "Bachelor of Culture & Arts Education", cluster: "Education" },
  { name: "Bachelor of Early Childhood Education", cluster: "Education" },
  { name: "Bachelor of Physical Education", cluster: "Education" },

  // ── Business & Accountancy ──
  { name: "BS Accountancy", cluster: "Business & Accountancy" },
  { name: "BS Accounting Information Systems", cluster: "Business & Accountancy" },
  { name: "BS Business Administration", cluster: "Business & Accountancy" },
  { name: "BS Business Analytics", cluster: "Business & Accountancy" },
  { name: "BS Customs Administration", cluster: "Business & Accountancy" },
  { name: "BS Entrepreneurship", cluster: "Business & Accountancy" },
  { name: "BS Hospitality Management", cluster: "Business & Accountancy" },
  { name: "BS Internal Auditing", cluster: "Business & Accountancy" },
  { name: "BS Management Accounting", cluster: "Business & Accountancy" },
  { name: "BS Office Administration", cluster: "Business & Accountancy" },
  { name: "BS Real Estate Management", cluster: "Business & Accountancy" },
  { name: "BS Tourism Management", cluster: "Business & Accountancy" },
  { name: "BSBA Financial Management", cluster: "Business & Accountancy" },
  { name: "BSBA Human Resource Management", cluster: "Business & Accountancy" },
  { name: "BSBA Marketing Management", cluster: "Business & Accountancy" },
  { name: "BSBA Operations Management", cluster: "Business & Accountancy" },

  // ── Sciences & Mathematics ──
  { name: "BS Applied Mathematics", cluster: "Sciences & Mathematics" },
  { name: "BS Applied Physics", cluster: "Sciences & Mathematics" },
  { name: "BS Biochemistry", cluster: "Sciences & Mathematics" },
  { name: "BS Biology", cluster: "Sciences & Mathematics" },
  { name: "BS Chemistry", cluster: "Sciences & Mathematics" },
  { name: "BS Geology", cluster: "Sciences & Mathematics" },
  { name: "BS Marine Biology", cluster: "Sciences & Mathematics" },
  { name: "BS Mathematics", cluster: "Sciences & Mathematics" },
  { name: "BS Meteorology", cluster: "Sciences & Mathematics" },
  { name: "BS Molecular Biology & Biotechnology", cluster: "Sciences & Mathematics" },
  { name: "BS Physics", cluster: "Sciences & Mathematics" },
  { name: "BS Statistics", cluster: "Sciences & Mathematics" },

  // ── Agriculture, Fisheries & Environment ──
  { name: "BS Agribusiness Management", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Agricultural Biotechnology", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Agricultural Economics", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Agriculture", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Agroforestry", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Animal Science", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Environmental Science", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Fisheries", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Food Technology", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Forestry", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Horticulture", cluster: "Agriculture, Fisheries & Environment" },
  { name: "BS Sustainable Development", cluster: "Agriculture, Fisheries & Environment" },

  // ── Arts, Humanities & Social Sciences ──
  { name: "AB Communication", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Economics", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB English Language Studies", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Filipino", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB History", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB International Studies", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Journalism", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Philosophy", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Political Science", cluster: "Arts, Humanities & Social Sciences" },
  { name: "AB Sociology", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Community Development", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Criminology", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Development Communication", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Psychology", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Public Administration", cluster: "Arts, Humanities & Social Sciences" },
  { name: "BS Social Work", cluster: "Arts, Humanities & Social Sciences" },
  { name: "Bachelor of Fine Arts", cluster: "Arts, Humanities & Social Sciences" },
  { name: "Bachelor of Laws / Juris Doctor", cluster: "Arts, Humanities & Social Sciences" },
  { name: "Bachelor of Music", cluster: "Arts, Humanities & Social Sciences" },

  // ── Maritime, Technical & Vocational ──
  { name: "BS Marine Engineering", cluster: "Maritime, Technical & Vocational" },
  { name: "BS Marine Transportation", cluster: "Maritime, Technical & Vocational" },
  { name: "Automotive Servicing NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Bookkeeping NC III", cluster: "Maritime, Technical & Vocational" },
  { name: "Bread and Pastry Production NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Contact Center Services NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Cookery NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Instrumentation and Control Servicing NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Mechatronics Servicing NC II", cluster: "Maritime, Technical & Vocational" },
  { name: "Motorcycle/Small Engine Servicing NC II", cluster: "Maritime, Technical & Vocational" },
];

/** Cluster order for the grouped dropdown. */
export const COURSE_CLUSTERS: CourseCluster[] = [
  "Computing & Data",
  "Engineering & Technology",
  "Health Sciences",
  "Education",
  "Business & Accountancy",
  "Sciences & Mathematics",
  "Agriculture, Fisheries & Environment",
  "Arts, Humanities & Social Sciences",
  "Maritime, Technical & Vocational",
];

export interface CourseGroup {
  value: CourseCluster;
  items: CourseOption[];
}

/** `COURSE_OPTIONS` shaped for Base UI's grouped Autocomplete. */
export const COURSE_GROUPS: CourseGroup[] = COURSE_CLUSTERS.map((cluster) => ({
  value: cluster,
  items: COURSE_OPTIONS.filter((option) => option.cluster === cluster),
})).filter((group) => group.items.length > 0);
