import { DATA } from "@/lib/scholarships";
import type { Decision } from "./advisory";
import { createInitialState, emptyProfile, type AppState, type Profile } from "./state";

const KEY = "tul-ai:state:v1";

/**
 * What survives a reload: who the student is, how far through the deck they
 * got, how they sorted it, and their document checklist. Nothing transient, and
 * no screen — the URL decides that.
 */
export interface PersistedState {
  profile: Profile;
  idx: number;
  decisions: Decision[];
  docs: Record<string, string[]>;
}

export function toPersistable(state: AppState): PersistedState {
  return {
    profile: state.profile,
    idx: state.idx,
    decisions: state.decisions,
    docs: state.docs,
  };
}

/**
 * A decision that survived JSON. `JSON.stringify` writes array holes as `null`,
 * so anything that isn't an explicit yes/no comes back as "not sorted yet" —
 * which must stay distinct from a decision the student actually made.
 */
function normalizeDecision(value: unknown): Decision {
  return value === "yes" || value === "no" ? value : undefined;
}

/** Only keep checklist entries for documents the scholarship actually asks for. */
function normalizeDocs(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const card of DATA) {
    const entry = (value as Record<string, unknown>)[card.id];
    if (!Array.isArray(entry)) continue;
    const kept = entry.filter((doc): doc is string => card.needs.includes(doc as string));
    if (kept.length > 0) out[card.id] = kept;
  }
  return out;
}

/** Pure hydration — merge persisted data onto a fresh state (testable). */
export function hydrateState(p: PersistedState | null): AppState {
  const base = createInitialState();
  if (!p) return base;
  return {
    ...base,
    profile: { ...emptyProfile(), ...p.profile },
    idx: Math.max(0, Math.min(p.idx, DATA.length)),
    decisions: DATA.map((_, i) => normalizeDecision(p.decisions?.[i])),
    docs: normalizeDocs(p.docs),
  };
}

export function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.profile || typeof parsed.profile !== "object") return null;
    return {
      profile: parsed.profile,
      idx: typeof parsed.idx === "number" ? parsed.idx : 0,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      docs: normalizeDocs(parsed.docs),
    };
  } catch {
    return null;
  }
}

export function persistState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(toPersistable(state)));
  } catch {
    /* storage unavailable or full — the app still works, it just won't resume */
  }
}

export function clearPersisted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
