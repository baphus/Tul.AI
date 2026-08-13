import type { RankedMatch } from "./matching";
import type { Profile } from "./state";

export type AiConfidence = "High" | "Medium" | "Low";

export interface AiExplanation {
  id: string;
  reason: string;
  confidence: AiConfidence;
  sources?: string[];
}

export interface AiReRankResult {
  reRanked: RankedMatch[];
  explanations: AiExplanation[];
}

/** Feature gate — enabled by default when running. */
export function aiEnabled(): boolean {
  return true;
}

/**
 * Re-ranker adapter. Uses /api/ai/rerank endpoint when available, with fallback
 * to deterministic fact-based explanations.
 */
export async function aiReRank(
  ranked: RankedMatch[],
  profile: Profile
): Promise<AiReRankResult> {
  const fallbackExplanations: AiExplanation[] = ranked.map((r) => ({
    id: r.id,
    reason: `${r.match} — ${r.met}/${r.total} published requirements met.`,
    confidence: r.tone === "strong" ? "High" : r.tone === "good" ? "Medium" : "Low",
  }));

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/ai/rerank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, rankedMatches: ranked }),
      });
      if (res.ok) {
        const json = (await res.json()) as AiReRankResult;
        if (json.explanations && Array.isArray(json.explanations)) {
          return {
            reRanked: json.reRanked ?? ranked,
            explanations: json.explanations,
          };
        }
      }
    } catch {
      // Fallback on network or runtime error
    }
  }

  return { reRanked: ranked.slice(), explanations: fallbackExplanations };
}

export default aiReRank;

