/**
 * The school vocabulary (spec §3.1, step 3).
 *
 * Filtered by the location answered on step 2 — that is the whole reason step 2
 * moved ahead of step 3. A student in Cebu City is shown Cebu schools first
 * rather than scrolling a national list, but the filter is a *default*, never a
 * restriction: `schoolsFor` widens from city to province, and the step offers an
 * explicit escape to the full list. Free text is always accepted.
 *
 * Input vocabulary only — see the note in `courses.ts`. `kind` exists because
 * some grants are restricted to state universities, so it is worth showing.
 */

import { provinceOf } from "./locations";

export type SchoolKind = "state" | "local" | "private" | "sectarian";

export interface SchoolOption {
  name: string;
  city: string;
  province: string;
  kind: SchoolKind;
}

export const SCHOOL_OPTIONS: SchoolOption[] = [
  // ── Cebu ──
  { name: "University of San Carlos", city: "Cebu City", province: "Cebu", kind: "sectarian" },
  { name: "Cebu Technological University", city: "Cebu City", province: "Cebu", kind: "state" },
  { name: "University of the Philippines Cebu", city: "Cebu City", province: "Cebu", kind: "state" },
  { name: "Cebu Normal University", city: "Cebu City", province: "Cebu", kind: "state" },
  { name: "University of Cebu", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "University of San Jose–Recoletos", city: "Cebu City", province: "Cebu", kind: "sectarian" },
  { name: "Cebu Institute of Technology – University", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "Cebu Doctors' University", city: "Mandaue City", province: "Cebu", kind: "private" },
  { name: "Southwestern University PHINMA", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "University of the Visayas", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "Cebu City Medical Center College", city: "Cebu City", province: "Cebu", kind: "local" },
  { name: "Cebu Institute of Medicine", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "Asian College of Technology", city: "Cebu City", province: "Cebu", kind: "private" },
  { name: "Benedicto College", city: "Mandaue City", province: "Cebu", kind: "private" },
  { name: "University of Cebu – Lapu-Lapu and Mandaue", city: "Mandaue City", province: "Cebu", kind: "private" },
  { name: "Cebu Technological University – Danao", city: "Danao City", province: "Cebu", kind: "state" },
  { name: "Cebu Technological University – Carmen", city: "Cebu (elsewhere in the province)", province: "Cebu", kind: "state" },
  { name: "Cebu Technological University – Toledo", city: "Toledo City", province: "Cebu", kind: "state" },
  { name: "Consolatrix College of Toledo City", city: "Toledo City", province: "Cebu", kind: "sectarian" },
  { name: "Talisay City College", city: "Talisay City", province: "Cebu", kind: "local" },

  // ── Metro Manila ──
  { name: "University of the Philippines Diliman", city: "Quezon City", province: "Metro Manila", kind: "state" },
  { name: "University of the Philippines Manila", city: "Manila", province: "Metro Manila", kind: "state" },
  { name: "Ateneo de Manila University", city: "Quezon City", province: "Metro Manila", kind: "sectarian" },
  { name: "De La Salle University", city: "Manila", province: "Metro Manila", kind: "sectarian" },
  { name: "University of Santo Tomas", city: "Manila", province: "Metro Manila", kind: "sectarian" },
  { name: "Polytechnic University of the Philippines", city: "Manila", province: "Metro Manila", kind: "state" },
  { name: "Mapúa University", city: "Manila", province: "Metro Manila", kind: "private" },
  { name: "Far Eastern University", city: "Manila", province: "Metro Manila", kind: "private" },
  { name: "University of the East", city: "Manila", province: "Metro Manila", kind: "private" },
  { name: "Technological University of the Philippines", city: "Manila", province: "Metro Manila", kind: "state" },
  { name: "Pamantasan ng Lungsod ng Maynila", city: "Manila", province: "Metro Manila", kind: "local" },
  { name: "Adamson University", city: "Manila", province: "Metro Manila", kind: "sectarian" },
  { name: "Centro Escolar University", city: "Manila", province: "Metro Manila", kind: "private" },
  { name: "National University", city: "Manila", province: "Metro Manila", kind: "private" },
  { name: "Quezon City University", city: "Quezon City", province: "Metro Manila", kind: "local" },
  { name: "New Era University", city: "Quezon City", province: "Metro Manila", kind: "sectarian" },
  { name: "Miriam College", city: "Quezon City", province: "Metro Manila", kind: "sectarian" },
  { name: "Rizal Technological University", city: "Mandaluyong City", province: "Metro Manila", kind: "state" },
  { name: "Pamantasan ng Lungsod ng Pasig", city: "Pasig City", province: "Metro Manila", kind: "local" },
  { name: "Taguig City University", city: "Taguig City", province: "Metro Manila", kind: "local" },
  { name: "University of Makati", city: "Makati City", province: "Metro Manila", kind: "local" },
  { name: "Marikina Polytechnic College", city: "Marikina City", province: "Metro Manila", kind: "state" },

  // ── Visayas beyond Cebu ──
  { name: "University of the Philippines Visayas", city: "Iloilo City", province: "Iloilo", kind: "state" },
  { name: "West Visayas State University", city: "Iloilo City", province: "Iloilo", kind: "state" },
  { name: "Central Philippine University", city: "Iloilo City", province: "Iloilo", kind: "sectarian" },
  { name: "University of San Agustin", city: "Iloilo City", province: "Iloilo", kind: "sectarian" },
  { name: "Silliman University", city: "Dumaguete City", province: "Negros Oriental", kind: "sectarian" },
  { name: "Negros Oriental State University", city: "Dumaguete City", province: "Negros Oriental", kind: "state" },
  { name: "University of St. La Salle", city: "Bacolod City", province: "Negros Occidental", kind: "sectarian" },
  { name: "Carlos Hilado Memorial State University", city: "Bacolod City", province: "Negros Occidental", kind: "state" },
  { name: "Visayas State University", city: "Ormoc City", province: "Leyte", kind: "state" },
  { name: "Eastern Visayas State University", city: "Tacloban City", province: "Leyte", kind: "state" },
  { name: "Bohol Island State University", city: "Tagbilaran City", province: "Bohol", kind: "state" },
  { name: "Holy Name University", city: "Tagbilaran City", province: "Bohol", kind: "sectarian" },
  { name: "Capiz State University", city: "Roxas City", province: "Capiz", kind: "state" },
  { name: "Aklan State University", city: "Aklan", province: "Aklan", kind: "state" },
  { name: "University of Antique", city: "Antique", province: "Antique", kind: "state" },

  // ── Luzon beyond Metro Manila ──
  { name: "University of the Philippines Los Baños", city: "Laguna", province: "Laguna", kind: "state" },
  { name: "University of the Philippines Baguio", city: "Baguio City", province: "Benguet", kind: "state" },
  { name: "Saint Louis University", city: "Baguio City", province: "Benguet", kind: "sectarian" },
  { name: "Benguet State University", city: "Baguio City", province: "Benguet", kind: "state" },
  { name: "Batangas State University", city: "Batangas City", province: "Batangas", kind: "state" },
  { name: "De La Salle Lipa", city: "Batangas", province: "Batangas", kind: "sectarian" },
  { name: "Cavite State University", city: "Cavite", province: "Cavite", kind: "state" },
  { name: "Bulacan State University", city: "Bulacan", province: "Bulacan", kind: "state" },
  { name: "Central Luzon State University", city: "Nueva Ecija", province: "Nueva Ecija", kind: "state" },
  { name: "Holy Angel University", city: "Angeles City", province: "Pampanga", kind: "sectarian" },
  { name: "Don Honorio Ventura State University", city: "San Fernando (Pampanga)", province: "Pampanga", kind: "state" },
  { name: "Ateneo de Naga University", city: "Naga City (Camarines Sur)", province: "Camarines Sur", kind: "sectarian" },
  { name: "Bicol University", city: "Legazpi City", province: "Albay", kind: "state" },
  { name: "Pangasinan State University", city: "Dagupan City", province: "Pangasinan", kind: "state" },
  { name: "Mariano Marcos State University", city: "Laoag City", province: "Ilocos Norte", kind: "state" },
  { name: "Cagayan State University", city: "Tuguegarao City", province: "Cagayan", kind: "state" },
  { name: "Western Philippines University", city: "Palawan", province: "Palawan", kind: "state" },

  // ── Mindanao ──
  { name: "University of the Philippines Mindanao", city: "Davao City", province: "Davao del Sur", kind: "state" },
  { name: "Ateneo de Davao University", city: "Davao City", province: "Davao del Sur", kind: "sectarian" },
  { name: "University of Southeastern Philippines", city: "Davao City", province: "Davao del Sur", kind: "state" },
  { name: "University of Mindanao", city: "Davao City", province: "Davao del Sur", kind: "private" },
  { name: "Xavier University – Ateneo de Cagayan", city: "Cagayan de Oro City", province: "Misamis Oriental", kind: "sectarian" },
  { name: "Mindanao State University – Iligan Institute of Technology", city: "Iligan City", province: "Lanao del Norte", kind: "state" },
  { name: "Western Mindanao State University", city: "Zamboanga City", province: "Zamboanga del Sur", kind: "state" },
  { name: "Ateneo de Zamboanga University", city: "Zamboanga City", province: "Zamboanga del Sur", kind: "sectarian" },
  { name: "Mindanao State University – General Santos", city: "General Santos City", province: "South Cotabato", kind: "state" },
  { name: "Caraga State University", city: "Butuan City", province: "Agusan del Norte", kind: "state" },
  { name: "Central Mindanao University", city: "Bukidnon", province: "Bukidnon", kind: "state" },
];

export interface SchoolFilter {
  schools: SchoolOption[];
  /** How the list was narrowed, so the UI can say so honestly. */
  scope: "city" | "province" | "all";
  /** The place the scope refers to, for the label. */
  place: string | null;
}

/**
 * Schools to offer for a location, widening until the list is worth showing.
 *
 * City first, then the province, then everything. Narrowing to a city that holds
 * one school would hide the twenty next door, so a city match only wins when it
 * has enough entries to be useful on its own.
 */
export function schoolsFor(location: string): SchoolFilter {
  const trimmed = location.trim();
  if (!trimmed) return { schools: SCHOOL_OPTIONS, scope: "all", place: null };

  const inCity = SCHOOL_OPTIONS.filter(
    (school) => school.city.toLowerCase() === trimmed.toLowerCase()
  );
  if (inCity.length >= 3) return { schools: inCity, scope: "city", place: trimmed };

  const province = provinceOf(trimmed);
  if (province) {
    const inProvince = SCHOOL_OPTIONS.filter((school) => school.province === province);
    if (inProvince.length > 0) {
      return { schools: inProvince, scope: "province", place: province };
    }
  }

  return { schools: SCHOOL_OPTIONS, scope: "all", place: null };
}
