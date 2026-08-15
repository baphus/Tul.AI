import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allowAiRequest,
  generateTulAIJson,
  TUL_AI_SYSTEM_INSTRUCTION,
} from "@/lib/logic/ai-config";
import type { RankedMatch } from "@/lib/logic/matching";
import type { AiExplanation } from "@/lib/logic/matching.ai";
import { requestedLanguage, responseLanguageInstruction } from "@/lib/logic/locale";

const explanationSchema = z.object({
  explanations: z.array(
    z.object({
      id: z.string(),
      reason: z.string().min(1).max(320),
    })
  ).min(1).max(5),
});

function fallback(matches: RankedMatch[], language: ReturnType<typeof requestedLanguage> = "ENG"): AiExplanation[] {
  const copy = language === "FIL"
    ? { of: "sa", matched: "na natugmang inilathalang requirement", confirm: "na dapat kumpirmahin" }
    : language === "BIS"
      ? { of: "sa", matched: "nga naparehas nga gipatik nga kinahanglanon", confirm: "nga angay kumpirmahon" }
      : { of: "of", matched: "published requirements matched", confirm: "to confirm" };
  return matches.slice(0, 5).map((match) => ({ id: match.id, reason: `${match.match} — ${match.met} ${copy.of} ${match.total} ${copy.matched}${match.unknown ? `; ${match.unknown} ${copy.confirm}` : ""}.` }));
}

export async function POST(request: Request) {
  try {
    const { rankedMatches, language } = (await request.json()) as { rankedMatches?: RankedMatch[]; language?: unknown };
    if (!Array.isArray(rankedMatches)) return NextResponse.json({ error: "Missing ranked matches." }, { status: 400 });
    const matches = rankedMatches.slice(0, 5);
    const responseLanguage = requestedLanguage(language);
    if (!allowAiRequest(request)) return NextResponse.json({ reRanked: rankedMatches, explanations: fallback(matches, responseLanguage), generated: false, limited: true });
    const generated = await generateTulAIJson<z.infer<typeof explanationSchema>>(
      `Create one concise, warm explanation per item from this deterministic match summary. Do not add facts, scores, or promises. Explain unknown requirements as information to confirm.\n${JSON.stringify(matches.map(({ id, match, met, total, unknown, checks }) => ({ id, match, met, total, unknown, checks })))}`,
      `${TUL_AI_SYSTEM_INSTRUCTION}\n\n${responseLanguageInstruction(responseLanguage)}`
    );
    const parsed = explanationSchema.safeParse(generated.data);
    if (!generated.success || !parsed.success) {
      return NextResponse.json({ reRanked: rankedMatches, explanations: fallback(matches, responseLanguage), generated: false });
    }
    const permitted = new Set(matches.map((match) => match.id));
    const explanations = parsed.data.explanations
      .filter((item) => permitted.has(item.id))
      .map((item): AiExplanation => ({ id: item.id, reason: item.reason }));
    return NextResponse.json({
      reRanked: rankedMatches,
      explanations: explanations?.length ? explanations : fallback(matches, responseLanguage),
      generated: Boolean(explanations?.length),
    });
  } catch {
    return NextResponse.json({ error: "Unable to explain matches right now." }, { status: 500 });
  }
}
