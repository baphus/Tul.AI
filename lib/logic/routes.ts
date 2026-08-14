import { DATA } from "@/lib/scholarships";

/**
 * Every screen is a real URL. Route strings live here so a page, a nav link and
 * a redirect can never drift apart, and so the onboarding step and the open
 * detail card are both shareable.
 */
export const ROUTES = {
  home: "/",
  howItWorks: "/how-it-works",
  roadmap: "/roadmap",
  privacy: "/privacy",
  scholarships: "/scholarships",
  scholarship: (id: string) => `/scholarships/${id}`,
  onboarding: "/onboarding",
  onboardingStep: (step: number) => `/onboarding?step=${clampStep(step)}`,
  /** The research moment — an animation over real work, and nothing else. */
  matching: "/matching",
  /** Where that research lands: the ranked list, on its own screen. */
  matches: "/matches",
  discover: "/discover",
  discoverCard: (id: string) => `/discover?card=${encodeURIComponent(id)}`,
  discoverCardExpanded: (id: string) => `/discover?card=${encodeURIComponent(id)}&panel=expanded`,
  review: "/review",
  saved: "/saved",
  profile: "/profile",
} as const;

/**
 * The conversational onboarding is six questions long: journey, location,
 * studies, academic standing, household, free text (spec §3.3).
 */
export const ONBOARDING_STEPS = 6;

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(ONBOARDING_STEPS, Math.max(1, Math.trunc(step)));
}

/** Read `?step=` from a search param, tolerating junk and arrays. */
export function parseStep(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const n = Number(raw);
  return Number.isNaN(n) ? 1 : clampStep(n);
}

/**
 * Read `?card=` from a search param. Unknown ids resolve to `null` so a stale
 * or hand-edited URL closes the pane instead of rendering the wrong programme.
 */
export function parseCardId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return DATA.some((d) => d.id === raw) ? raw : null;
}

/** Index of a card id in the deck, or `-1`. */
export function cardIndexOf(id: string | null): number {
  if (!id) return -1;
  return DATA.findIndex((d) => d.id === id);
}

/**
 * Resolve a selected record from the collection currently rendered by a
 * client surface. The collection may be ranked or filtered, so its position
 * must never be inferred from the canonical dataset's order.
 */
export function cardForId<T extends { id: string }>(
  cards: readonly T[],
  id: string | null,
  fallback: T | null = null
): T | null {
  if (!id) return fallback;
  return cards.find((card) => card.id === id) ?? null;
}
