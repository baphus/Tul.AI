import { CHIP_EXCLUSIVE, DATA } from "@/lib/scholarships";
import { advisory, type Advice, type Decision } from "./advisory";

/**
 * Client state for the signed-out prototype: who the student is, how they have
 * sorted the deck, and which application documents they have ticked off.
 *
 * Navigation is NOT in here — the URL owns which screen is showing. Anything
 * scoped to a single surface (a detail view's conversation, a verification run)
 * lives in that component, not in this reducer.
 */
export interface Profile {
  name: string;
  city: string;
  stage: string;
  school: string;
  course: string;
  year: string;
  /**
   * The band a student picked, e.g. "90–94". The primary academic answer: it is
   * coarser than an exact figure, so it discloses less for the same matching
   * power (AGENTS.md §9, spec §2.5).
   */
  gwaBand: string;
  /** An exact GWA, optional. Where present it wins, because a point settles a
   *  comparison a band can only straddle — see `gwaBounds` in matching.ts. */
  gwa: string;
  income: string;
  /** Household size changes what an income bracket means for need-based aid. */
  householdBand: string;
  /** An exact household size, optional. Read by no eligibility check. */
  dependents: string;
  chips: string[];
  notes: string;
}

export interface DeckSnapshot {
  idx: number;
  decisions: Decision[];
}

export interface AppState {
  /** False until localStorage has been read, so nothing renders stale data. */
  hydrated: boolean;

  profile: Profile;

  /** Deck position and how each scholarship was sorted. */
  idx: number;
  decisions: Decision[];
  history: DeckSnapshot[];
  flipped: boolean;
  advice: Advice | null;
  shownAdvice: Record<string, boolean>;

  /** Matching-sequence ticker (0–5). */
  stageN: number;

  /** Application checklist — scholarship id → the documents already prepared. */
  docs: Record<string, string[]>;
}

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_FIELD"; field: keyof Omit<Profile, "chips">; value: string }
  | { type: "TOGGLE_CHIP"; value: string }
  | { type: "DEMO_FILL" }
  | { type: "CLEAR_PROFILE" }
  | { type: "SET_MATCH_STAGE"; n: number }
  | { type: "RESET_DECK" }
  | { type: "FLING"; dir: 1 | -1; index?: number }
  | { type: "COMMIT_FLING"; index?: number }
  | { type: "UNDO" }
  | { type: "TAP_CARD" }
  | { type: "SET_FLIPPED"; value: boolean }
  | { type: "DISMISS_ADVICE" }
  | { type: "MOVE"; index: number }
  | { type: "TOGGLE_DOC"; id: string; doc: string }
  | { type: "RESET_ALL" };

export function emptyProfile(): Profile {
  return {
    name: "",
    city: "",
    stage: "",
    school: "",
    course: "",
    year: "",
    gwaBand: "",
    gwa: "",
    income: "",
    householdBand: "",
    dependents: "",
    chips: [],
    notes: "",
  };
}

export function createInitialState(): AppState {
  return {
    hydrated: false,
    profile: emptyProfile(),
    idx: 0,
    decisions: Array(DATA.length).fill(undefined) as Decision[],
    history: [],
    flipped: false,
    advice: null,
    shownAdvice: {},
    stageN: 0,
    docs: {},
  };
}

/* ── Selectors ─────────────────────────────────────────────
   Counts are derived rather than stored, so they can never disagree with the
   decisions they describe. */

export function savedCount(state: Pick<AppState, "decisions">): number {
  return state.decisions.filter((d) => d === "yes").length;
}

export function passedCount(state: Pick<AppState, "decisions">): number {
  return state.decisions.filter((d) => d === "no").length;
}

export function unsortedCount(state: Pick<AppState, "decisions">): number {
  return DATA.length - savedCount(state) - passedCount(state);
}

export function isDeckDone(state: Pick<AppState, "idx">): boolean {
  return state.idx >= DATA.length;
}

/** Indexes of the scholarships a student marked as interesting, in deck order. */
export function savedIndexes(state: Pick<AppState, "decisions">): number[] {
  return state.decisions.flatMap((d, i) => (d === "yes" ? [i] : []));
}

export function checkedDocs(state: Pick<AppState, "docs">, id: string): string[] {
  return state.docs[id] ?? [];
}

function cloneDecisions(decisions: Decision[]): Decision[] {
  return decisions.slice();
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    /** One-shot: replace state with the hydrated (localStorage) snapshot. */
    case "HYDRATE":
      return { ...action.state, hydrated: true };

    case "SET_FIELD":
      return { ...state, profile: { ...state.profile, [action.field]: action.value } };

    /**
     * Circumstance chips, with the two exclusive answers enforced here rather
     * than in the UI so the profile editor and the onboarding step cannot
     * disagree (spec §2.3).
     *
     * "None" and "Prefer not to say" are statements about the whole list, so
     * they clear every other selection and each other; picking an actual
     * circumstance clears them. A state where "None" sits beside "4Ps household"
     * is unrepresentable, which is what lets `specialCheck` read "None" as
     * evidence rather than as a contradiction.
     */
    case "TOGGLE_CHIP": {
      const current = state.profile.chips;
      const value = action.value;

      if (current.includes(value)) {
        return {
          ...state,
          profile: { ...state.profile, chips: current.filter((c) => c !== value) },
        };
      }

      const chips = CHIP_EXCLUSIVE.includes(value)
        ? [value]
        : [...current.filter((c) => !CHIP_EXCLUSIVE.includes(c)), value];

      return { ...state, profile: { ...state.profile, chips } };
    }

    case "DEMO_FILL":
      return {
        ...state,
        profile: {
          ...state.profile,
          name: "Josephus",
          city: "Cebu City",
          stage: "College Student",
          school: "Cebu Technological University",
          course: "BS Information Systems",
          year: "1st Year",
          gwa: "94.5",
        },
      };

    /** Privacy §32: a student can wipe their profile without losing the app. */
    case "CLEAR_PROFILE":
      return { ...state, profile: emptyProfile() };

    case "SET_MATCH_STAGE":
      return { ...state, stageN: action.n };

    case "RESET_DECK":
      return {
        ...state,
        idx: 0,
        decisions: Array(DATA.length).fill(undefined) as Decision[],
        history: [],
        flipped: false,
        advice: null,
        shownAdvice: {},
      };

    case "FLING": {
      const index = action.index ?? state.idx;
      if (index < 0 || index >= DATA.length) return state;
      const decisions = cloneDecisions(state.decisions);
      decisions[index] = action.dir > 0 ? "yes" : "no";
      return {
        ...state,
        decisions,
        history: [
          ...state.history,
          { idx: state.idx, decisions: cloneDecisions(state.decisions) },
        ],
      };
    }

    case "COMMIT_FLING": {
      const index = action.index ?? state.idx;
      if (index < 0 || index >= DATA.length) return state;
      const next = state.idx + 1;
      const advised = state.decisions[index] === "yes" ? advisory(state.decisions) : null;
      let shownAdvice = state.shownAdvice;
      let advice: Advice | null = null;
      if (advised && next < DATA.length && !shownAdvice[advised.id]) {
        shownAdvice = { ...shownAdvice, [advised.id]: true };
        advice = advised;
      }
      return { ...state, idx: next, advice, shownAdvice, flipped: false };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        history: state.history.slice(0, -1),
        idx: previous.idx,
        decisions: cloneDecisions(previous.decisions),
        flipped: false,
        advice: null,
      };
    }

    case "TAP_CARD":
      return { ...state, flipped: !state.flipped };

    case "SET_FLIPPED":
      return state.flipped === action.value ? state : { ...state, flipped: action.value };

    case "DISMISS_ADVICE":
      return { ...state, advice: null };

    case "MOVE": {
      if (action.index < 0 || action.index >= DATA.length) return state;
      const decisions = cloneDecisions(state.decisions);
      decisions[action.index] = decisions[action.index] === "yes" ? "no" : "yes";
      return { ...state, decisions };
    }

    case "TOGGLE_DOC": {
      const current = state.docs[action.id] ?? [];
      const next = current.includes(action.doc)
        ? current.filter((d) => d !== action.doc)
        : [...current, action.doc];
      return { ...state, docs: { ...state.docs, [action.id]: next } };
    }

    case "RESET_ALL":
      return createInitialState();
  }
}
