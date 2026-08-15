import { beforeEach, describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import { createInitialState, savedCount, type AppState } from "./state";
import {
  clearPersisted,
  hydrateState,
  loadPersisted,
  persistState,
  toPersistable,
  type PersistedState,
} from "./storage";

/** Minimal localStorage stand-in — the tests run in the node environment. */
function installStorage() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    },
  };
  return map;
}

const persisted = (over: Partial<PersistedState> = {}): PersistedState => ({
  profile: createInitialState().profile,
  idx: 0,
  decisions: [],
  docs: {},
  hasTappedCard: false,
  ...over,
});

describe("toPersistable", () => {
  it("keeps only the durable fields", () => {
    const state: AppState = {
      ...createInitialState(),
      idx: 2,
      decisions: ["yes", "no", undefined, undefined, undefined, undefined],
      docs: { [DATA[0].id]: [DATA[0].needs[0]] },
      flipped: true,
      hasTappedCard: true,
      stageN: 5,
      advice: { id: "x", title: "t", text: "b" },
    };

    expect(toPersistable(state)).toEqual({
      profile: state.profile,
      idx: 2,
      decisions: state.decisions,
      docs: state.docs,
      hasTappedCard: true,
    });
  });
});

describe("hydrateState", () => {
  it("returns a fresh state when nothing was stored", () => {
    expect(hydrateState(null)).toEqual(createInitialState());
  });

  it("restores the profile, shortlist, position and checklist", () => {
    const s = hydrateState(
      persisted({
        profile: { ...createInitialState().profile, city: "Cebu City", gwa: "94.5" },
        idx: 4,
        decisions: ["yes", "no", "yes", undefined, undefined, undefined],
        docs: { [DATA[0].id]: [DATA[0].needs[0]] },
      })
    );

    expect(s.profile.city).toBe("Cebu City");
    expect(s.profile.gwa).toBe("94.5");
    expect(s.idx).toBe(4);
    expect(savedCount(s)).toBe(2);
    expect(s.docs[DATA[0].id]).toEqual([DATA[0].needs[0]]);
  });

  it("allows the finished-deck position but nothing beyond it", () => {
    expect(hydrateState(persisted({ idx: DATA.length })).idx).toBe(DATA.length);
    expect(hydrateState(persisted({ idx: 999 })).idx).toBe(DATA.length);
    expect(hydrateState(persisted({ idx: -5 })).idx).toBe(0);
  });

  it("pads a short decision list to the current data set", () => {
    const s = hydrateState(persisted({ decisions: ["yes"] }));
    expect(s.decisions).toHaveLength(DATA.length);
    expect(s.decisions[0]).toBe("yes");
    expect(s.decisions[1]).toBeUndefined();
  });

  it("reads a JSON null back as 'not sorted yet', never as a passed card", () => {
    const s = hydrateState(
      // JSON.stringify writes array holes as null.
      persisted({ decisions: JSON.parse('["yes",null,"no",null,null,null]') })
    );
    const expected = Array(DATA.length).fill(undefined);
    expected[0] = "yes";
    expected[2] = "no";
    expect(s.decisions).toEqual(expected);
    expect(savedCount(s)).toBe(1);
  });

  it("drops checklist entries the scholarship never asked for", () => {
    const s = hydrateState(
      persisted({
        docs: {
          [DATA[0].id]: [DATA[0].needs[0], "A document from a previous data set"],
          "deleted-scholarship": ["Anything"],
        },
      })
    );
    expect(s.docs[DATA[0].id]).toEqual([DATA[0].needs[0]]);
    expect(s.docs["deleted-scholarship"]).toBeUndefined();
  });

  it("fills in a profile field added after the data was stored", () => {
    const s = hydrateState(
      persisted({ profile: { city: "Cebu City" } as PersistedState["profile"] })
    );
    expect(s.profile.dependents).toBe("");
    expect(s.profile.chips).toEqual([]);
  });
});

describe("round trip through storage", () => {
  beforeEach(() => {
    installStorage();
  });

  it("writes and reads the same durable state back", () => {
    const state: AppState = {
      ...createInitialState(),
      profile: { ...createInitialState().profile, city: "Cebu City", gwa: "94.5" },
      idx: 3,
      decisions: ["yes", "yes", "no", ...Array(DATA.length - 3).fill(undefined)],
      docs: { [DATA[2].id]: [DATA[2].needs[1]] },
    };

    persistState(state);
    const rehydrated = hydrateState(loadPersisted());

    expect(rehydrated.decisions).toEqual(state.decisions);
    expect(rehydrated.idx).toBe(3);
    expect(savedCount(rehydrated)).toBe(2);
    expect(rehydrated.profile.gwa).toBe("94.5");
    expect(rehydrated.docs).toEqual(state.docs);
  });

  it("returns null once cleared", () => {
    persistState(createInitialState());
    clearPersisted();
    expect(loadPersisted()).toBeNull();
  });

  it("ignores a malformed payload instead of throwing", () => {
    const map = installStorage();
    map.set("tul-ai:state:v1", "{not json");
    expect(loadPersisted()).toBeNull();

    map.set("tul-ai:state:v1", JSON.stringify({ idx: 2 }));
    expect(loadPersisted()).toBeNull();
  });
});
