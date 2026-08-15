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
    const groundTruth = chatFor(question, safeProfile, matchedCards, responseLanguage);
    const liveResearch = shouldUseLiveResearch(question) && canUseLiveResearch();
    const officialDomains = matchedCards.flatMap((card) =>
      card.sources.flatMap((source) => {
        try {
          return [new URL(source.url).hostname];
        } catch {
          return [];
        }
      })
    );
    const publishedMatches = matchedCards.map((card) => ({
      provider: card.provider,
      program: card.title,
      deadline: card.deadline,
      verification: card.verification,
      lastVerified: card.lastVerified,
      source: card.sources[0]?.url ?? card.host,
    }));
    const result = await generateTulAIResponse(
      `You are Tul.AI's student opportunity assistant. Answer the student's question clearly and warmly using the authoritative deterministic guidance and published records below.

Student question: ${question}

=== AUTHORITATIVE MATCH GUIDANCE ===
${groundTruth.text}
=== END AUTHORITATIVE MATCH GUIDANCE ===

=== MATCHED PUBLISHED RECORDS ===
${JSON.stringify(publishedMatches)}
=== END MATCHED PUBLISHED RECORDS ===

Rules:
- The authoritative match guidance is final. Do not revise eligibility, match buckets, ranking, or acceptance likelihood.
- Explain that guidance in 2–4 sentences; never invent facts absent from the records.
- Unknown details stay unknown, not ineligible.
- Never guarantee an award or application outcome.
- Applications and official decisions belong to the provider.
${liveResearch ? "- You may add current facts only from official provider domains and must cite them." : "- Do not add facts beyond the supplied guidance and records."}

${responseLanguageInstruction(responseLanguage)}`,
      { liveResearch, officialDomains, language: responseLanguage, maxTokens: 700 }
    );
    if (!result.success || !result.text) {
      if (result.error) console.error("[/api/ai/chat] AI unavailable:", result.error);
      return NextResponse.json({
        answer: groundTruth,
        answerOrigin: "published-record",
        liveResearch: "unavailable",
      });
    }
    return NextResponse.json({
      answer: {
        text: result.text,
        src: groundTruth.src,
        citations: result.citations,
      },
      answerOrigin: "ai",
      liveResearch: result.searched ? "used" : "not-needed",
    });
  } catch {
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
