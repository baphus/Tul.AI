import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { generateTulAIResponse, resolveGeminiApiKey } from "@/lib/logic/ai-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId } = body as { cardId?: string };

    if (!cardId) {
      return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
    }

    const card = DATA.find((c) => c.id === cardId);
    if (!card) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    const apiKey = resolveGeminiApiKey(process.env);
    if (!apiKey) {
      return NextResponse.json({
        verified: card.verify,
        sources: card.sources,
        lastVerified: card.lastVerified,
      });
    }

    const prompt = `Scholarship: ${card.provider} - ${card.title}
Official Sources: ${JSON.stringify(card.sources)}
Last Verified Date: ${card.lastVerified}
Published Verification Summary: "${card.verify}"

Instructions:
Provide a concise 2-sentence AI verification summary confirming that official provider sources were checked. Reassure the student about the official sources and application deadline (${card.deadline}).`;

    const res = await generateTulAIResponse(prompt);

    if (res.success && typeof res.text === "string" && res.text.trim()) {
      return NextResponse.json({
        verified: res.text.trim(),
        sources: card.sources,
        lastVerified: card.lastVerified,
      });
    }

    return NextResponse.json({
      verified: card.verify,
      sources: card.sources,
      lastVerified: card.lastVerified,
    });
  } catch (error) {
    console.error("Error in /api/ai/verify:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
