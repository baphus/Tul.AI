import { DATA } from "@/lib/scholarships";

/**
 * Every screen is a real URL. Route strings live here so a page, a nav link and
 * a redirect can never drift apart, and so the onboarding step and the open
 * detail card are both shareable.
 */
export const ROUTES = {
  home: "/",
  howItWorks: "/how-it-works",
  institutions: "/for-institutions",
  privacy: "/privacy",
  scholarships: "/scholarships",
  scholarship: (id: string) => `/scholarships/${id}`,
  onboarding: "/onboarding",
  onboardingStep: (step: number) => `/onboarding?step=${clampStep(step)}`,
  matching: "/matching",
  discover: "/discover",
  discoverCard: (id: string) => `/discover?card=${encodeURIComponent(id)}`,
  review: "/review",
  saved: "/saved",
  profile: "/profile",
} as const;

/** The conversational onboarding is five questions long. */
export const ONBOARDING_STEPS = 5;

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
