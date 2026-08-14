import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { allowAiRequest, canUseLiveResearch, generateTulAIResponse } from "@/lib/logic/ai-config";
import { requestedLanguage } from "@/lib/logic/locale";

export async function POST(request: Request) {
  try {
    const { cardId, language } = (await request.json()) as { cardId?: string; language?: unknown };
    if (!cardId) return NextResponse.json({ error: "Missing scholarship." }, { status: 400 });
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
    const card = DATA.find((item) => item.id === cardId);
    if (!card) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
    const domains = card.sources.map((source) => { try { return new URL(source.url).hostname; } catch { return null; } }).filter((value): value is string => Boolean(value));
    const responseLanguage = requestedLanguage(language);
    if (!canUseLiveResearch()) {
      return NextResponse.json({ verified: card.verify, sources: card.sources, lastVerified: card.lastVerified, liveResearch: "unavailable" });
    }
    const result = await generateTulAIResponse(
      `Verify only current, official information for ${card.provider} — ${card.title}. Existing record status: ${card.verification}; last checked: ${card.lastVerified}; listed deadline: ${card.deadline}. Summarize what an official source confirms and clearly say what cannot be confirmed. Do not say a source was checked unless it is cited.`,
      { liveResearch: true, officialDomains: domains, language: responseLanguage }
    );
    if (!result.success || !result.text || result.citations.length === 0) {
      return NextResponse.json({ verified: card.verify, sources: card.sources, lastVerified: card.lastVerified, liveResearch: "unavailable" });
    }
    return NextResponse.json({ verified: result.text, sources: card.sources, citations: result.citations, lastVerified: card.lastVerified, liveResearch: "used" });
  } catch {
    return NextResponse.json({ error: "Unable to verify this record right now." }, { status: 500 });
  }
}
