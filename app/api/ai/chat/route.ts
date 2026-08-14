import { NextResponse } from "next/server";
import { getScholarships } from "@/lib/scholarships";
import { chatFor } from "@/lib/logic/chat";
import { allowAiRequest, canUseLiveResearch, generateTulAIResponse, shouldUseLiveResearch } from "@/lib/logic/ai-config";
import { matchScholarship } from "@/lib/logic/matching";
import { emptyProfile, type Profile } from "@/lib/logic/state";
import { requestedLanguage, responseLanguageInstruction } from "@/lib/logic/locale";

export async function POST(request: Request) {
  try {
    const { question, profile, language } = (await request.json()) as { question?: string; profile?: Profile; language?: unknown };
    if (!question || typeof question !== "string" || question.trim().length > 1_600) {
      return NextResponse.json({ error: "Enter a question of up to 1,600 characters." }, { status: 400 });
    }
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });

    const safeProfile = profile ?? { ...emptyProfile(), stage: "Senior High School" };
    const responseLanguage = requestedLanguage(language);
    const matchedCards = (await getScholarships()).filter(
      (card) => card.verification !== "Expired" && matchScholarship(card, safeProfile).tone !== "none"
    );
    const groundTruth = chatFor(question, safeProfile, matchedCards);
    const liveResearch = shouldUseLiveResearch(question) && canUseLiveResearch();
    if (!liveResearch) {
      return NextResponse.json({ answer: groundTruth, liveResearch: "not-needed" });
    }
    const officialDomains = matchedCards.flatMap((card) =>
      card.sources.flatMap((source) => {
        try {
          return [new URL(source.url).hostname];
        } catch {
          return [];
        }
      })
    );
    const result = await generateTulAIResponse(
      `Student question: ${question}\n\nLocal, deterministic guidance about the student's eligible or possible matches: ${groundTruth.text}\n\nWrite only any additional, fresh research context. Do not restate, revise, or determine eligibility, match buckets, or acceptance likelihood. The local guidance remains authoritative for this student's match. ${responseLanguageInstruction(responseLanguage)} Research only updates from the official provider domains for the matched records. Cite every source, and use it only for eligibility, deadlines, documents, application links, or availability.`,
      { liveResearch, officialDomains, language: responseLanguage }
    );
    if (!result.success || !result.text) {
      return NextResponse.json({ answer: groundTruth, liveResearch: "unavailable" });
    }
    return NextResponse.json({
      answer: {
        text: `${groundTruth.text}\n\nFresh research: ${result.text}`,
        src: groundTruth.src,
        citations: result.citations,
      },
      liveResearch: result.searched ? "used" : "not-needed",
    });
  } catch {
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
