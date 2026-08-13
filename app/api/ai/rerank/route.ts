import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { generateTulAIJson, resolveGeminiApiKey } from "@/lib/logic/ai-config";
import type { Profile } from "@/lib/logic/state";
import type { RankedMatch } from "@/lib/logic/matching";
import type { AiExplanation } from "@/lib/logic/matching.ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, rankedMatches } = body as {
      profile?: Profile;
      rankedMatches?: RankedMatch[];
    };

    if (!profile || !rankedMatches || !Array.isArray(rankedMatches)) {
      return NextResponse.json({ error: "Missing profile or ranked matches" }, { status: 400 });
    }

    const apiKey = resolveGeminiApiKey(process.env);
    if (!apiKey) {
      // Fallback deterministic explanations
      const fallbackExplanations: AiExplanation[] = rankedMatches.map((r) => ({
        id: r.id,
        reason: `${r.match} — ${r.met}/${r.total} published requirements met.`,
        confidence: r.tone === "strong" ? "High" : r.tone === "good" ? "Medium" : "Low",
      }));
      return NextResponse.json({ reRanked: rankedMatches, explanations: fallbackExplanations });
    }

    // Top candidates to explain with Gemini AI
    const candidates = rankedMatches.slice(0, 5).map((r) => {
      const card = DATA.find((c) => c.id === r.id);
      return {
        id: r.id,
        provider: card?.provider,
        title: card?.title,
        tone: r.tone,
        met: r.met,
        total: r.total,
        checks: r.checks,
      };
    });

    const prompt = `Student Profile:
- Location: ${profile.city || "Unspecified"}
- Course: ${profile.course || "Unspecified"}
- School: ${profile.school || "Unspecified"}
- Stage: ${profile.stage || "Unspecified"}
- Year: ${profile.year || "Unspecified"}
- GWA: ${profile.gwa || "Unspecified"}
- Income: ${profile.income || "Unspecified"}
- Special Circumstances: ${profile.chips.join(", ") || "None"}
- Student Notes: ${profile.notes || "None"}

Candidates:
${JSON.stringify(candidates, null, 2)}

Instructions:
Generate personalized 1-sentence explanations for why each scholarship matches (or doesn't match) this student.
Respond strictly in JSON matching this format:
{
  "explanations": [
    {
      "id": "scholarship-id-string",
      "reason": "1 clear sentence explaining why this scholarship fits the student's course, location, or circumstances",
      "confidence": "High" | "Medium" | "Low"
    }
  ]
}
`;

    const res = await generateTulAIJson<{ explanations: AiExplanation[] }>(prompt);

    if (res.success && res.data?.explanations) {
      return NextResponse.json({
        reRanked: rankedMatches,
        explanations: res.data.explanations,
      });
    }

    // Fallback if JSON generation fails
    const fallbackExplanations: AiExplanation[] = rankedMatches.map((r) => ({
      id: r.id,
      reason: `${r.match} — ${r.met}/${r.total} published requirements met.`,
      confidence: r.tone === "strong" ? "High" : r.tone === "good" ? "Medium" : "Low",
    }));

    return NextResponse.json({ reRanked: rankedMatches, explanations: fallbackExplanations });
  } catch (error) {
    console.error("Error in /api/ai/rerank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
