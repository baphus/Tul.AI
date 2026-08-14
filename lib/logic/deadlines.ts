const DAY_MS = 86_400_000;

export type DeadlineTone = "closed" | "urgent" | "soon" | "open";

/** Local calendar date as `YYYY-MM-DD` — stable for a whole day. */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Whole days from `todayIso` to `deadlineIso`. Both are date-only, so this is
 * pure calendar arithmetic with no timezone drift. Negative means closed.
 */
export function daysUntil(deadlineIso: string, todayIso: string): number {
  const deadline = Date.parse(`${deadlineIso}T00:00:00Z`);
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  if (Number.isNaN(deadline) || Number.isNaN(today)) return Number.NaN;
  return Math.round((deadline - today) / DAY_MS);
}

/** A record with no published date remains discoverable; a dated past window does not. */
export function isDeadlineOpen(deadlineIso: string, todayIso: string): boolean {
  if (deadlineIso === "9999-12-31") return true;
  const days = daysUntil(deadlineIso, todayIso);
  return Number.isNaN(days) || days >= 0;
}

export function deadlineTone(days: number): DeadlineTone {
  if (Number.isNaN(days)) return "open";
  if (days < 0) return "closed";
  if (days <= 7) return "urgent";
  if (days <= 21) return "soon";
  return "open";
}

/** Human label for a countdown. Never invents certainty about a closed date. */
export function deadlineLabel(days: number): string {
  if (Number.isNaN(days)) return "Deadline not published";
  if (days < 0) return "Application period has closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/** Days between two deadlines, used to spot clustered application windows. */
export function daysBetween(isoA: string, isoB: string): number {
  return Math.abs(daysUntil(isoA, isoB));
}

/** Formats an ISO date as e.g. "11 August 2026" for verification timestamps. */
export function formatIsoDate(iso: string): string {
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
