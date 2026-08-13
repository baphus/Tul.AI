import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "@/lib/logic/answerFor";
import { allowAiRequest, generateTulAIResponse, shouldUseLiveResearch } from "@/lib/logic/ai-config";
import { requestedLanguage } from "@/lib/logic/locale";

export async function POST(request: Request) {
  try {
    const { question, cardId, language } = (await request.json()) as { question?: string; cardId?: string; language?: unknown };
    if (!question || typeof question !== "string" || !cardId || question.trim().length > 1_600) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
    const card = DATA.find((item) => item.id === cardId);
    if (!card) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
    const local = answerFor(question, card);
    const responseLanguage = requestedLanguage(language);
    const liveResearch = shouldUseLiveResearch(question);
    const domains = card.sources.map((source) => {
      try { return new URL(source.url).hostname; } catch { return null; }
    }).filter((domain): domain is string => Boolean(domain));
    const result = await generateTulAIResponse(
      `Scholarship: ${card.provider} — ${card.title}\nStudent question: ${question}\nLocal published-record answer: ${local.text}\n\nExplain only this answer. ${liveResearch ? "Research current provider facts only; use official source citations." : "Do not add unstated facts."}`,
      { liveResearch, officialDomains: domains, language: responseLanguage }
    );
    if (!result.success || !result.text) return NextResponse.json({ answer: local, liveResearch: "unavailable" });
    return NextResponse.json({ answer: { text: result.text, src: local.src, citations: result.citations }, liveResearch: result.searched ? "used" : "not-needed" });
  } catch {
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
