import { describe, expect, it } from "vitest";

import { DATA, KIND } from "@/lib/scholarships";
import {
  checkedDocs,
  createInitialState,
  isDeckDone,
  passedCount,
  reducer,
  savedCount,
  savedIndexes,
  unsortedCount,
  type Action,
  type AppState,
} from "./state";

/** Apply a list of actions in order — the reducer must stay pure throughout. */
function run(actions: Action[], from: AppState = createInitialState()): AppState {
  return actions.reduce(reducer, from);
}

/** Sort one card, the way the deck does: record the decision, then advance. */
function swipe(state: AppState, dir: 1 | -1): AppState {
  return run([{ type: "FLING", dir }, { type: "COMMIT_FLING" }], state);
}

describe("profile", () => {
  it("sets and clears individual fields", () => {
    let s = reducer(createInitialState(), {
      type: "SET_FIELD",
      field: "city",
      value: "Cebu City",
    });
    expect(s.profile.city).toBe("Cebu City");

    s = reducer(s, { type: "SET_FIELD", field: "course", value: "BS Nursing" });
    expect(s.profile).toMatchObject({ city: "Cebu City", course: "BS Nursing" });
  });

  it("toggles optional circumstance chips without dropping the others", () => {
    let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "OFW parent" });
    s = reducer(s, { type: "TOGGLE_CHIP", value: "PWD" });
    expect(s.profile.chips).toEqual(["OFW parent", "PWD"]);
    s = reducer(s, { type: "TOGGLE_CHIP", value: "OFW parent" });
    expect(s.profile.chips).toEqual(["PWD"]);
  });

  /*
   * Exclusivity lives in the reducer rather than the UI so the onboarding step
   * and the profile editor cannot disagree — and so a state where "None" sits
   * beside a disclosed circumstance is unrepresentable, which is what lets the
   * engine read "None" as evidence rather than as a contradiction (spec §2.3).
   */
  describe("exclusive circumstance answers", () => {
    it("clears every circumstance when 'None' is picked", () => {
      let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "OFW parent" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "PWD" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "None" });
      expect(s.profile.chips).toEqual(["None"]);
    });

    it("clears every circumstance when 'Prefer not to say' is picked", () => {
      let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "4Ps household" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "Prefer not to say" });
      expect(s.profile.chips).toEqual(["Prefer not to say"]);
    });

    it("clears the exclusive answer when a circumstance is picked", () => {
      let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "None" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "OFW parent" });
      expect(s.profile.chips).toEqual(["OFW parent"]);
    });

    it("keeps the two exclusive answers mutually exclusive", () => {
      let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "None" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "Prefer not to say" });
      expect(s.profile.chips).toEqual(["Prefer not to say"]);
      s = reducer(s, { type: "TOGGLE_CHIP", value: "None" });
      expect(s.profile.chips).toEqual(["None"]);
    });

    it("still lets an exclusive answer be unticked back to nothing", () => {
      let s = reducer(createInitialState(), { type: "TOGGLE_CHIP", value: "None" });
      s = reducer(s, { type: "TOGGLE_CHIP", value: "None" });
      expect(s.profile.chips).toEqual([]);
    });
  });

  it("fills a demo profile", () => {
    const s = reducer(createInitialState(), { type: "DEMO_FILL" });
    expect(s.profile).toMatchObject({
      city: "Cebu City",
      course: "BS Information Systems",
      gwa: "94.5",
    });
  });

  it("wipes the profile without touching the deck (privacy §32)", () => {
    const sorted = swipe(reducer(createInitialState(), { type: "DEMO_FILL" }), 1);
    const cleared = reducer(sorted, { type: "CLEAR_PROFILE" });

    expect(cleared.profile.city).toBe("");
    expect(cleared.profile.chips).toEqual([]);
    expect(cleared.decisions[0]).toBe("yes");
    expect(cleared.idx).toBe(1);
  });
});

describe("deck sorting", () => {
  it("records a decision and advances one card", () => {
    const s = swipe(createInitialState(), 1);
    expect(s.decisions[0]).toBe("yes");
    expect(savedCount(s)).toBe(1);
    expect(s.idx).toBe(1);
  });

  it("counts only interested cards toward the shortlist", () => {
    const s = swipe(swipe(createInitialState(), -1), -1);
    expect(savedCount(s)).toBe(0);
    expect(passedCount(s)).toBe(2);
    expect(unsortedCount(s)).toBe(DATA.length - 2);
  });

  it("reports the deck as done only after the last card", () => {
    let s = createInitialState();
    for (let i = 0; i < DATA.length - 1; i++) s = swipe(s, -1);
    expect(isDeckDone(s)).toBe(false);
    s = swipe(s, -1);
    expect(isDeckDone(s)).toBe(true);
  });

  it("ignores a swipe past the end of the deck", () => {
    let s = createInitialState();
    for (let i = 0; i < DATA.length; i++) s = swipe(s, 1);
    const after = swipe(s, 1);
    expect(after.idx).toBe(DATA.length);
    expect(savedCount(after)).toBe(DATA.length);
  });

  it("undoes the last swipe without mutating the state it came from", () => {
    const swiped = swipe(createInitialState(), 1);
    const historyBefore = swiped.history.length;

    const undone = reducer(swiped, { type: "UNDO" });
    expect(undone.idx).toBe(0);
    expect(savedCount(undone)).toBe(0);
    expect(undone.decisions[0]).toBeUndefined();
    // the previous state object is untouched — no in-place history.pop()
    expect(swiped.history).toHaveLength(historyBefore);
    expect(swiped.decisions[0]).toBe("yes");
  });

  it("does nothing when there is no history to undo", () => {
    const start = createInitialState();
    expect(reducer(start, { type: "UNDO" })).toBe(start);
  });

  it("resets the deck but keeps the profile", () => {
    const s = swipe(reducer(createInitialState(), { type: "DEMO_FILL" }), 1);
    const reset = reducer(s, { type: "RESET_DECK" });
    expect(reset.idx).toBe(0);
    expect(savedCount(reset)).toBe(0);
    expect(reset.history).toHaveLength(0);
    expect(reset.profile.city).toBe("Cebu City");
  });

  it("flips the card and can be forced back", () => {
    const flipped = reducer(createInitialState(), { type: "TAP_CARD" });
    expect(flipped.flipped).toBe(true);
    const back = reducer(flipped, { type: "SET_FLIPPED", value: false });
    expect(back.flipped).toBe(false);
    // no-op when already in the requested state
    expect(reducer(back, { type: "SET_FLIPPED", value: false })).toBe(back);
  });

  it("shows a piece of cross-scholarship advice at most once", () => {
    // The first two cards are both national programs.
    expect(KIND[0]).toBe("national");
    expect(KIND[1]).toBe("national");

    const s = swipe(swipe(createInitialState(), 1), 1);
    expect(s.advice?.id).toBe("national");

    const dismissed = reducer(s, { type: "DISMISS_ADVICE" });
    expect(dismissed.advice).toBeNull();

    const third = swipe(dismissed, 1);
    expect(third.advice).toBeNull();
    expect(third.shownAdvice.national).toBe(true);
  });
});

describe("re-sorting from the review screen", () => {
  it("moves a card in either direction and keeps the counts in step", () => {
    let s = swipe(createInitialState(), 1);
    s = reducer(s, { type: "MOVE", index: 0 });
    expect(s.decisions[0]).toBe("no");
    expect(savedCount(s)).toBe(0);

    s = reducer(s, { type: "MOVE", index: 0 });
    expect(s.decisions[0]).toBe("yes");
    expect(savedCount(s)).toBe(1);
  });

  it("treats an unsorted card as a move up", () => {
    const s = reducer(createInitialState(), { type: "MOVE", index: 3 });
    expect(s.decisions[3]).toBe("yes");
    expect(savedIndexes(s)).toEqual([3]);
  });

  it("ignores an out-of-range move", () => {
    const start = createInitialState();
    expect(reducer(start, { type: "MOVE", index: DATA.length })).toBe(start);
    expect(reducer(start, { type: "MOVE", index: -1 })).toBe(start);
  });
});

describe("application checklist", () => {
  const id = DATA[0].id;
  const doc = DATA[0].needs[0];

  it("ticks and un-ticks a document per scholarship", () => {
    let s = reducer(createInitialState(), { type: "TOGGLE_DOC", id, doc });
    expect(checkedDocs(s, id)).toEqual([doc]);

    s = reducer(s, { type: "TOGGLE_DOC", id, doc });
    expect(checkedDocs(s, id)).toEqual([]);
  });

  it("keeps each scholarship's checklist separate", () => {
    const other = DATA[1].id;
    let s = reducer(createInitialState(), { type: "TOGGLE_DOC", id, doc });
    s = reducer(s, { type: "TOGGLE_DOC", id: other, doc: DATA[1].needs[0] });

    expect(checkedDocs(s, id)).toEqual([doc]);
    expect(checkedDocs(s, other)).toEqual([DATA[1].needs[0]]);
    expect(checkedDocs(s, "unknown-id")).toEqual([]);
  });
});

describe("lifecycle", () => {
  it("marks state as hydrated when storage is read", () => {
    const persisted: AppState = { ...createInitialState(), idx: 3 };
    const s = reducer(createInitialState(), { type: "HYDRATE", state: persisted });
    expect(s.idx).toBe(3);
    expect(s.hydrated).toBe(true);
  });

  it("tracks the matching sequence", () => {
    const s = run([{ type: "SET_MATCH_STAGE", n: 4 }]);
    expect(s.stageN).toBe(4);
  });

  it("resets everything", () => {
    const dirty = swipe(reducer(createInitialState(), { type: "DEMO_FILL" }), 1);
    expect(reducer(dirty, { type: "RESET_ALL" })).toEqual(createInitialState());
  });
});
