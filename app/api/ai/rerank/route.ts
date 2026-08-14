import { NextResponse } from "next/server";
import { allowAiRequest, generateTulAIJson } from "@/lib/logic/ai-config";
import type { RankedMatch } from "@/lib/logic/matching";
import type { AiExplanation } from "@/lib/logic/matching.ai";
import { requestedLanguage, responseLanguageInstruction } from "@/lib/logic/locale";

function fallback(matches: RankedMatch[]): AiExplanation[] {
  return matches.slice(0, 5).map((match) => ({ id: match.id, reason: `${match.match} — ${match.met} of ${match.total} published requirements matched${match.unknown ? `; ${match.unknown} to confirm` : ""}.` }));
}

export async function POST(request: Request) {
  try {
    const { rankedMatches, language } = (await request.json()) as { rankedMatches?: RankedMatch[]; language?: unknown };
    if (!Array.isArray(rankedMatches)) return NextResponse.json({ error: "Missing ranked matches." }, { status: 400 });
    const matches = rankedMatches.slice(0, 5);
    if (!allowAiRequest(request)) return NextResponse.json({ reRanked: rankedMatches, explanations: fallback(matches), limited: true });
    const result = await generateTulAIJson<{ explanations?: AiExplanation[] }>(`Create one concise, warm explanation per item from this deterministic match summary. Do not add facts, scores, or promises. Explain unknown requirements as information to confirm. ${responseLanguageInstruction(requestedLanguage(language))}\n${JSON.stringify(matches.map(({ id, match, met, total, unknown, checks }) => ({ id, match, met, total, unknown, checks })))}`);
    const permitted = new Set(matches.map((match) => match.id));
    const explanations = result.data?.explanations?.filter((item) => permitted.has(item.id) && typeof item.reason === "string").map((item) => ({ id: item.id, reason: item.reason.slice(0, 320) }));
    return NextResponse.json({ reRanked: rankedMatches, explanations: explanations?.length ? explanations : fallback(matches) });
  } catch {
    return NextResponse.json({ error: "Unable to explain matches right now." }, { status: 500 });
  }
}
