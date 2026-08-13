"use client";

import { useSyncExternalStore } from "react";

import { localIsoDate } from "@/lib/logic/deadlines";

/** Nothing to subscribe to — the date only matters at render time. */
const noop = () => () => {};

/**
 * Today's local calendar date as `YYYY-MM-DD`, or `null` on the server and
 * during the first paint.
 *
 * Countdowns ("17 days left") must not be baked into a prerendered page — the
 * HTML would be wrong the next morning. Components render the absolute deadline
 * until this returns a date, then add the relative label.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    noop,
    () => localIsoDate(),
    () => null
  );
}
