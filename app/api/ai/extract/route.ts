import { NextResponse } from "next/server";
import { generateTulAIJson, resolveGeminiApiKey } from "@/lib/logic/ai-config";
import { CHIPS } from "@/lib/scholarships";

export interface ExtractedProfileData {
  city?: string;
  course?: string;
  stage?: string;
  year?: string;
  gwa?: string;
  income?: string;
  chips?: string[];
  summary?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
    }

    const apiKey = resolveGeminiApiKey(process.env);
    if (!apiKey) {
      return NextResponse.json({
        extracted: null,
        message: "Gemini API key is not configured.",
      });
    }

    const prompt = `The student provided the following natural-language description about themselves:
"${text}"

Available Special Category Chips to choose from (pick ONLY exact matching items if mentioned):
${JSON.stringify(CHIPS)}

Instructions:
Extract relevant structured profile attributes from the text. Respond with a valid JSON object matching this TypeScript interface:
{
  "city": string | undefined, // e.g. "Cebu City" or "Mandaue City"
  "course": string | undefined, // e.g. "BS Nursing" or "BS Computer Science"
  "stage": string | undefined, // "Senior High School" | "College Student" | "Graduate Student" | "Incoming College Freshman"
  "year": string | undefined, // "1st Year" | "2nd Year" | "3rd Year" | "4th Year"
  "gwa": string | undefined, // numeric GWA string between 60 and 100
  "chips": string[], // array containing exact matches from available chips listed above
  "summary": string // 1-sentence friendly explanation of extracted details
}
`;

    const res = await generateTulAIJson<ExtractedProfileData>(prompt);

    if (res.success && res.data) {
      return NextResponse.json({ extracted: res.data });
    }

    return NextResponse.json({
      extracted: null,
      error: res.error || "Failed to extract profile data",
    });
  } catch (error) {
    console.error("Error in /api/ai/extract:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
