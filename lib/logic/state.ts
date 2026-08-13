import { DATA } from "@/lib/scholarships";
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
  gwa: string;
  income: string;
  /** Household size changes what an income bracket means for need-based aid. */
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
  | { type: "FLING"; dir: 1 | -1 }
  | { type: "COMMIT_FLING" }
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
    gwa: "",
    income: "",
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

    case "TOGGLE_CHIP": {
      const chips = state.profile.chips.includes(action.value)
        ? state.profile.chips.filter((c) => c !== action.value)
        : [...state.profile.chips, action.value];
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
      if (state.idx >= DATA.length) return state;
      const decisions = cloneDecisions(state.decisions);
      decisions[state.idx] = action.dir > 0 ? "yes" : "no";
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
      if (state.idx >= DATA.length) return state;
      const next = state.idx + 1;
      const advised = state.decisions[state.idx] === "yes" ? advisory(state.decisions) : null;
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
