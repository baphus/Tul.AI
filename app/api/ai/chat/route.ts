import { NextResponse } from "next/server";
import { getScholarships } from "@/lib/scholarships";
import { chatFor } from "@/lib/logic/chat";
import { generateTulAIResponse, resolveGeminiApiKey } from "@/lib/logic/ai-config";
import { emptyProfile, type Profile } from "@/lib/logic/state";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, profile } = body as { question?: string; profile?: Profile };

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    /* Built from emptyProfile() rather than an inline literal so a new Profile
       field cannot silently leave this default incomplete. */
    const safeProfile: Profile = profile ?? {
      ...emptyProfile(),
      stage: "Senior High School",
    };

    // Fetch scholarships through the swap seam
    const scholarships = await getScholarships();

    // Compute ground-truth answer from deterministic engine
    const groundTruth = chatFor(question, safeProfile, scholarships);

    const apiKey = resolveGeminiApiKey(process.env);
    if (!apiKey) {
      return NextResponse.json({ answer: groundTruth });
    }

    const prompt = `Student Question: "${question}"

Student Profile:
- City/Location: ${safeProfile.city || "Not provided"}
- Course: ${safeProfile.course || "Not provided"}
- Stage: ${safeProfile.stage || "Not provided"}
- Year Level: ${safeProfile.year || "Not provided"}
- GWA: ${safeProfile.gwa || "Not provided"}
- Income: ${safeProfile.income || "Not provided"}
- Circumstances: ${safeProfile.chips.join(", ") || "None"}

Deterministic Ground Truth Fact:
"${groundTruth.text}"

Instructions:
Synthesize a warm, clear, concise, and helpful response for the student based strictly on the Deterministic Ground Truth Fact above. Do NOT invent new requirements, do NOT estimate numeric win probabilities, and do NOT guarantee scholarship acceptance. Keep it conversational and supportive for a Filipino student.`;

    const aiRes = await generateTulAIResponse(prompt);

    if (aiRes.success && typeof aiRes.text === "string" && aiRes.text.trim()) {
      return NextResponse.json({
        answer: {
          text: aiRes.text.trim(),
          src: groundTruth.src,
        },
      });
    }

    // Fallback to deterministic answer if AI call fails
    return NextResponse.json({ answer: groundTruth });
  } catch (error) {
    console.error("Error in /api/ai/chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
