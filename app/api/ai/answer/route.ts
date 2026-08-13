import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "@/lib/logic/answerFor";
import { generateTulAIResponse, resolveGeminiApiKey } from "@/lib/logic/ai-config";
import type { Profile } from "@/lib/logic/state";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, cardId, profile } = body as {
      question?: string;
      cardId?: string;
      profile?: Profile;
    };

    if (!question || typeof question !== "string" || !cardId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const card = DATA.find((c) => c.id === cardId);
    if (!card) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    // Compute ground truth answer for this specific scholarship
    const groundTruth = answerFor(question, card);

    const apiKey = resolveGeminiApiKey(process.env);
    if (!apiKey) {
      return NextResponse.json({ answer: groundTruth });
    }

    const prompt = `Scholarship: ${card.provider} ${card.title}
Student Question: "${question}"
Published Source Document: ${groundTruth.src || card.sources[0]?.name || "Official Provider Notice"}

Deterministic Record Fact:
"${groundTruth.text}"

Instructions:
Synthesize a clear, direct, and grounded answer for the student based strictly on the Deterministic Record Fact above.
- If the fact says the information is not stated or published, clearly state that the provider has not published that detail.
- Do NOT guess or hallucinate unstated rules.
- Keep the response short, clear, and reassuring.`;

    const aiRes = await generateTulAIResponse(prompt);

    if (aiRes.success && typeof aiRes.text === "string" && aiRes.text.trim()) {
      return NextResponse.json({
        answer: {
          text: aiRes.text.trim(),
          src: groundTruth.src,
        },
      });
    }

    return NextResponse.json({ answer: groundTruth });
  } catch (error) {
    console.error("Error in /api/ai/answer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
