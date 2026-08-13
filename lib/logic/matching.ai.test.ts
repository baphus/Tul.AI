import { describe, expect, it } from "vitest";
import { emptyProfile } from "./state";
import type { RankedMatch, MatchTone4 } from "./matching";
import { aiReRank } from "./matching.ai";

function mk(id: string, met: number, total: number, tone: MatchTone4): RankedMatch {
  return {
    id,
    met,
    total,
    tone,
    match: tone,
    checks: [],
  } as RankedMatch;
}

describe("AI re-ranker prototype", () => {
  it("returns same-length list and explanations for each item", async () => {
    const input: RankedMatch[] = [mk("a", 3, 3, "strong"), mk("b", 1, 2, "possible")];
    const { reRanked, explanations } = await aiReRank(input, emptyProfile());
    expect(reRanked.length).toBe(input.length);
    expect(explanations.length).toBe(input.length);
    // IDs preserved in explanations
    expect(explanations.map((e) => e.id).sort()).toEqual(input.map((r) => r.id).sort());
  });
});
