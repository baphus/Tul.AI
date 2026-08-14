import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

import {
  allowAiRequest,
  resolveOpenAiApiKey,
  resolveOpenAiModel,
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

function fallback(matches: RankedMatch[]): AiExplanation[] {
  return matches.slice(0, 5).map((match) => ({ id: match.id, reason: `${match.match} — ${match.met} of ${match.total} published requirements matched${match.unknown ? `; ${match.unknown} to confirm` : ""}.` }));
}

export async function POST(request: Request) {
  try {
    const { rankedMatches, language } = (await request.json()) as { rankedMatches?: RankedMatch[]; language?: unknown };
    if (!Array.isArray(rankedMatches)) return NextResponse.json({ error: "Missing ranked matches." }, { status: 400 });
    const matches = rankedMatches.slice(0, 5);
    if (!allowAiRequest(request)) return NextResponse.json({ reRanked: rankedMatches, explanations: fallback(matches), generated: false, limited: true });
    const apiKey = resolveOpenAiApiKey(process.env);
    if (!apiKey) {
      return NextResponse.json({ reRanked: rankedMatches, explanations: fallback(matches), generated: false });
    }

    const openai = createOpenAI({ apiKey });
    const { object } = await generateObject({
      model: openai(resolveOpenAiModel(process.env)),
      schema: explanationSchema,
      system: `${TUL_AI_SYSTEM_INSTRUCTION}\n\n${responseLanguageInstruction(requestedLanguage(language))}`,
      prompt: `Create one concise, warm explanation per item from this deterministic match summary. Do not add facts, scores, or promises. Explain unknown requirements as information to confirm.\n${JSON.stringify(matches.map(({ id, match, met, total, unknown, checks }) => ({ id, match, met, total, unknown, checks })))}`,
    });
    const permitted = new Set(matches.map((match) => match.id));
    const explanations = object.explanations
      .filter((item) => permitted.has(item.id))
      .map((item): AiExplanation => ({ id: item.id, reason: item.reason }));
    return NextResponse.json({
      reRanked: rankedMatches,
      explanations: explanations?.length ? explanations : fallback(matches),
      generated: Boolean(explanations?.length),
    });
  } catch {
    return NextResponse.json({ error: "Unable to explain matches right now." }, { status: 500 });
  }
}
