/**
 * Coarse answer bands for the two questions that used to demand a free-text
 * number (AGENTS.md §9, spec §2.5).
 *
 * A band is deliberately *less* information than the exact figure it replaces —
 * a student who answers only the band discloses a range rather than a precise
 * academic record, for the same matching power. The exact fields still exist and
 * stay optional; where an exact value is present it wins, because it can resolve
 * a comparison a band cannot (see `gwaBounds` in lib/logic/matching.ts).
 *
 * Bounds are inclusive on both ends. `WITHHELD` is not a band: it is a student
 * declining to answer, which must resolve to Unknown rather than to any interval.
 */

/**
 * A band is the half-open interval `[low, high + 1)`, not the closed integer
 * range its label suggests.
 *
 * This matters because GWAs are fractional. A student with 94.5 belongs in the
 * band labelled "90–94" — that is how Philippine HEIs read it — so the interval
 * has to extend to just below 95 rather than stopping at 94. Use
 * `upperExclusive()` for any arithmetic; `high` is the number in the label.
 */
export interface Band {
  /** The stored value — also the visible label. */
  value: string;
  /** Inclusive lower bound. */
  low: number;
  /** The upper bound *as labelled*. The interval runs to just below `high + 1`. */
  high: number;
  /** Why a student might pick this one, shown under the label. */
  note?: string;
}

/** The exclusive upper bound of a band's interval. See the note on `Band`. */
export function upperExclusive(band: Band): number {
  return band.high + 1;
}

/** The value meaning "I'd rather not say" — stored, but carries no interval. */
export const WITHHELD = "Prefer not to say";

/**
 * GWA bands, highest first, because merit programmes publish minimums and a
 * student scanning for the one they clear reads downward.
 *
 * The ranges match how Philippine HEIs actually publish cut-offs: Latin honours
 * sit at 90 and above, and most merit scholarships publish 85 or 88.
 */
export const GWA_BANDS: Band[] = [
  { value: "95–100", low: 95, high: 100, note: "Usually clears every published cut-off" },
  { value: "90–94", low: 90, high: 94, note: "Clears most merit programmes" },
  { value: "85–89", low: 85, high: 89, note: "Clears many need-based and LGU programmes" },
  { value: "80–84", low: 80, high: 84, note: "Below most merit cut-offs, but need-based aid rarely asks" },
  { value: "Below 80", low: 60, high: 79, note: "Need-based and category programmes usually publish no GWA" },
];

/**
 * Household-size bands. The engine reads none of these — only the income
 * bracket feeds an eligibility check — so they inform ranking completeness and
 * the student's own sense of what an income ceiling means for them.
 */
export const HOUSEHOLD_BANDS: Band[] = [
  { value: "1–2", low: 1, high: 2 },
  { value: "3–4", low: 3, high: 4 },
  { value: "5–6", low: 5, high: 6 },
  { value: "7–8", low: 7, high: 8 },
  { value: "9 or more", low: 9, high: 20 },
];

/** Look a band up by its stored value. `null` for `""`, `WITHHELD` or junk. */
export function bandByValue(bands: Band[], value: string): Band | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === WITHHELD) return null;
  return bands.find((band) => band.value === trimmed) ?? null;
}

/**
 * The band an exact figure falls into, for pre-selecting a card.
 *
 * Half-open, so 94.5 lands in "90–94" rather than in the gap between bands.
 */
export function bandFor(bands: Band[], exact: number): Band | null {
  return (
    bands.find((band) => exact >= band.low && exact < upperExclusive(band)) ?? null
  );
}
