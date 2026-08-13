"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { hydrateState, loadPersisted, persistState } from "@/lib/logic/storage";
import { createInitialState, reducer, type Action, type AppState } from "@/lib/logic/state";
import type { Scholarship } from "@/lib/scholarships";

interface TulAiContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  /** Scholarships handed down from the server (see getScholarships()). */
  cards: Scholarship[];
  /** False until localStorage has been read, so nothing flashes stale data. */
  ready: boolean;
}

const TulAiContext = createContext<TulAiContextValue | null>(null);

export function useTulAi(): TulAiContextValue {
  const ctx = useContext(TulAiContext);
  if (!ctx) throw new Error("useTulAi must be used inside <TulAiProvider>");
  return ctx;
}

/** Optional variant that returns `null` when the provider is not mounted. */
export function useTulAiOptional(): TulAiContextValue | null {
  return useContext(TulAiContext);
}

/** How long a piece of cross-scholarship advice stays on screen. */
const ADVICE_MS = 9000;

export function TulAiProvider({
  cards,
  children,
}: {
  cards: Scholarship[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const hydrated = useRef(false);

  /* Profile and shortlist come back from localStorage; the URL decides screens. */
  useEffect(() => {
    dispatch({ type: "HYDRATE", state: hydrateState(loadPersisted()) });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    persistState(state);
  }, [state]);

  useEffect(() => {
    if (!state.advice) return;
    const t = window.setTimeout(() => dispatch({ type: "DISMISS_ADVICE" }), ADVICE_MS);
    return () => window.clearTimeout(t);
  }, [state.advice]);

  const value = useMemo<TulAiContextValue>(
    () => ({ state, dispatch, cards, ready: state.hydrated }),
    [state, cards]
  );

  // Avoid rendering children until persisted state is applied. If children
  // mount before hydration they can dispatch updates (onboarding inputs)
  // which the subsequent HYDRATE action would overwrite, causing a race and
  // surprising behaviour where freshly-entered answers disappear. Hold the
  // UI until `state.hydrated` is true so the initial snapshot is authoritative.
  return (
    <TulAiContext.Provider value={value}>
      {state.hydrated ? children : null}
    </TulAiContext.Provider>
  );
}
