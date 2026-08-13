import { NextResponse } from "next/server";
import { getScholarships } from "@/lib/scholarships";
import { chatFor } from "@/lib/logic/chat";
import { allowAiRequest, generateTulAIResponse, shouldUseLiveResearch } from "@/lib/logic/ai-config";
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
    const groundTruth = chatFor(question, safeProfile, await getScholarships());
    const liveResearch = shouldUseLiveResearch(question);
    const result = await generateTulAIResponse(
      `Student question: ${question}\n\nLocal, deterministic guidance: ${groundTruth.text}\n\nWrite a helpful answer. The local guidance is authoritative for this student's match. ${responseLanguageInstruction(responseLanguage)} ${liveResearch ? "Use web research only for fresh provider facts and cite official sources." : "Do not browse or add facts beyond the local guidance."}`,
      { liveResearch, language: responseLanguage }
    );
    if (!result.success || !result.text) {
      return NextResponse.json({ answer: groundTruth, liveResearch: "unavailable" });
    }
    return NextResponse.json({ answer: { text: result.text, src: groundTruth.src, citations: result.citations }, liveResearch: result.searched ? "used" : "not-needed" });
  } catch {
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
