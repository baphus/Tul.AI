/**
 * Where a student is based (spec §3.3, step 2).
 *
 * Two jobs, which is why this question moved ahead of the studies question:
 * residency requirements published by LGU and provincial programmes, and
 * filtering the school list down to somewhere plausible.
 *
 * Cebu is covered street-level because the MVP is Cebu-first (AGENTS.md §11);
 * the rest of the country is provinces plus the cities large enough to run their
 * own scholarship office. This is input vocabulary — see the note in
 * `courses.ts`. Free text is still accepted, so an unlisted municipality never
 * blocks anyone.
 */

export interface LocationOption {
  value: string;
  kind: "city" | "province";
  /** The province a city sits in — the key the school filter widens to. */
  province: string;
  island: "Luzon" | "Visayas" | "Mindanao";
}

export const LOCATION_OPTIONS: LocationOption[] = [
  // ── Cebu, in detail ──
  { value: "Cebu City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Mandaue City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Lapu-Lapu City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Talisay City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Toledo City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Danao City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Carcar City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Naga City (Cebu)", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Bogo City", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Consolacion", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Minglanilla", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Liloan", kind: "city", province: "Cebu", island: "Visayas" },
  { value: "Cebu Province", kind: "province", province: "Cebu", island: "Visayas" },

  // ── Metro Manila ──
  { value: "Manila", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Quezon City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Makati City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Pasig City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Taguig City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Parañaque City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Caloocan City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Las Piñas City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Marikina City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Muntinlupa City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Pasay City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "San Juan City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Valenzuela City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Mandaluyong City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Malabon City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Navotas City", kind: "city", province: "Metro Manila", island: "Luzon" },
  { value: "Pateros", kind: "city", province: "Metro Manila", island: "Luzon" },

  // ── Visayas ──
  { value: "Bacolod City", kind: "city", province: "Negros Occidental", island: "Visayas" },
  { value: "Iloilo City", kind: "city", province: "Iloilo", island: "Visayas" },
  { value: "Tacloban City", kind: "city", province: "Leyte", island: "Visayas" },
  { value: "Dumaguete City", kind: "city", province: "Negros Oriental", island: "Visayas" },
  { value: "Tagbilaran City", kind: "city", province: "Bohol", island: "Visayas" },
  { value: "Ormoc City", kind: "city", province: "Leyte", island: "Visayas" },
  { value: "Roxas City", kind: "city", province: "Capiz", island: "Visayas" },
  { value: "Aklan", kind: "province", province: "Aklan", island: "Visayas" },
  { value: "Antique", kind: "province", province: "Antique", island: "Visayas" },
  { value: "Biliran", kind: "province", province: "Biliran", island: "Visayas" },
  { value: "Bohol", kind: "province", province: "Bohol", island: "Visayas" },
  { value: "Capiz", kind: "province", province: "Capiz", island: "Visayas" },
  { value: "Eastern Samar", kind: "province", province: "Eastern Samar", island: "Visayas" },
  { value: "Guimaras", kind: "province", province: "Guimaras", island: "Visayas" },
  { value: "Iloilo", kind: "province", province: "Iloilo", island: "Visayas" },
  { value: "Leyte", kind: "province", province: "Leyte", island: "Visayas" },
  { value: "Negros Occidental", kind: "province", province: "Negros Occidental", island: "Visayas" },
  { value: "Negros Oriental", kind: "province", province: "Negros Oriental", island: "Visayas" },
  { value: "Northern Samar", kind: "province", province: "Northern Samar", island: "Visayas" },
  { value: "Samar", kind: "province", province: "Samar", island: "Visayas" },
  { value: "Siquijor", kind: "province", province: "Siquijor", island: "Visayas" },
  { value: "Southern Leyte", kind: "province", province: "Southern Leyte", island: "Visayas" },

  // ── Luzon ──
  { value: "Baguio City", kind: "city", province: "Benguet", island: "Luzon" },
  { value: "Angeles City", kind: "city", province: "Pampanga", island: "Luzon" },
  { value: "San Fernando (Pampanga)", kind: "city", province: "Pampanga", island: "Luzon" },
  { value: "Naga City (Camarines Sur)", kind: "city", province: "Camarines Sur", island: "Luzon" },
  { value: "Legazpi City", kind: "city", province: "Albay", island: "Luzon" },
  { value: "Batangas City", kind: "city", province: "Batangas", island: "Luzon" },
  { value: "Lucena City", kind: "city", province: "Quezon", island: "Luzon" },
  { value: "Dagupan City", kind: "city", province: "Pangasinan", island: "Luzon" },
  { value: "Laoag City", kind: "city", province: "Ilocos Norte", island: "Luzon" },
  { value: "Tuguegarao City", kind: "city", province: "Cagayan", island: "Luzon" },
  { value: "Albay", kind: "province", province: "Albay", island: "Luzon" },
  { value: "Bataan", kind: "province", province: "Bataan", island: "Luzon" },
  { value: "Batangas", kind: "province", province: "Batangas", island: "Luzon" },
  { value: "Benguet", kind: "province", province: "Benguet", island: "Luzon" },
  { value: "Bulacan", kind: "province", province: "Bulacan", island: "Luzon" },
  { value: "Cagayan", kind: "province", province: "Cagayan", island: "Luzon" },
  { value: "Camarines Norte", kind: "province", province: "Camarines Norte", island: "Luzon" },
  { value: "Camarines Sur", kind: "province", province: "Camarines Sur", island: "Luzon" },
  { value: "Cavite", kind: "province", province: "Cavite", island: "Luzon" },
  { value: "Ilocos Norte", kind: "province", province: "Ilocos Norte", island: "Luzon" },
  { value: "Ilocos Sur", kind: "province", province: "Ilocos Sur", island: "Luzon" },
  { value: "Isabela", kind: "province", province: "Isabela", island: "Luzon" },
  { value: "Laguna", kind: "province", province: "Laguna", island: "Luzon" },
  { value: "La Union", kind: "province", province: "La Union", island: "Luzon" },
  { value: "Nueva Ecija", kind: "province", province: "Nueva Ecija", island: "Luzon" },
  { value: "Pampanga", kind: "province", province: "Pampanga", island: "Luzon" },
  { value: "Pangasinan", kind: "province", province: "Pangasinan", island: "Luzon" },
  { value: "Palawan", kind: "province", province: "Palawan", island: "Luzon" },
  { value: "Quezon", kind: "province", province: "Quezon", island: "Luzon" },
  { value: "Rizal", kind: "province", province: "Rizal", island: "Luzon" },
  { value: "Sorsogon", kind: "province", province: "Sorsogon", island: "Luzon" },
  { value: "Tarlac", kind: "province", province: "Tarlac", island: "Luzon" },
  { value: "Zambales", kind: "province", province: "Zambales", island: "Luzon" },

  // ── Mindanao ──
  { value: "Davao City", kind: "city", province: "Davao del Sur", island: "Mindanao" },
  { value: "Cagayan de Oro City", kind: "city", province: "Misamis Oriental", island: "Mindanao" },
  { value: "Zamboanga City", kind: "city", province: "Zamboanga del Sur", island: "Mindanao" },
  { value: "General Santos City", kind: "city", province: "South Cotabato", island: "Mindanao" },
  { value: "Iligan City", kind: "city", province: "Lanao del Norte", island: "Mindanao" },
  { value: "Butuan City", kind: "city", province: "Agusan del Norte", island: "Mindanao" },
  { value: "Cotabato City", kind: "city", province: "Maguindanao", island: "Mindanao" },
  { value: "Agusan del Norte", kind: "province", province: "Agusan del Norte", island: "Mindanao" },
  { value: "Agusan del Sur", kind: "province", province: "Agusan del Sur", island: "Mindanao" },
  { value: "Bukidnon", kind: "province", province: "Bukidnon", island: "Mindanao" },
  { value: "Davao del Norte", kind: "province", province: "Davao del Norte", island: "Mindanao" },
  { value: "Davao del Sur", kind: "province", province: "Davao del Sur", island: "Mindanao" },
  { value: "Lanao del Norte", kind: "province", province: "Lanao del Norte", island: "Mindanao" },
  { value: "Misamis Occidental", kind: "province", province: "Misamis Occidental", island: "Mindanao" },
  { value: "Misamis Oriental", kind: "province", province: "Misamis Oriental", island: "Mindanao" },
  { value: "South Cotabato", kind: "province", province: "South Cotabato", island: "Mindanao" },
  { value: "Surigao del Norte", kind: "province", province: "Surigao del Norte", island: "Mindanao" },
  { value: "Zamboanga del Sur", kind: "province", province: "Zamboanga del Sur", island: "Mindanao" },
];

/**
 * Visible location suggestions for the Cebu-first MVP. The full catalogue above
 * remains available to resolve existing profiles and school metadata, while the
 * onboarding picker only presents places the product currently covers locally.
 */
export const CEBU_LOCATION_OPTIONS = LOCATION_OPTIONS.filter(
  (option) => option.province === "Cebu"
);

/** The province a stored location value belongs to, or `null` for free text. */
export function provinceOf(location: string): string | null {
  const trimmed = location.trim();
  if (!trimmed) return null;
  const exact = LOCATION_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact.province;

  /* The five quick pills on step 2 are coarser than this list — "Elsewhere in
     Cebu" is a province, not a city — so they resolve by name rather than by a
     lookup that would miss. */
  if (/cebu/i.test(trimmed)) return "Cebu";
  if (/metro manila|ncr/i.test(trimmed)) return "Metro Manila";
  if (/davao/i.test(trimmed)) return "Davao del Sur";
  return null;
}
