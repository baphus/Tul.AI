import { NextResponse } from "next/server";
import { allowAiRequest, generateTulAIJson } from "@/lib/logic/ai-config";
import { CHIPS } from "@/lib/scholarships";
import { requestedLanguage, responseLanguageInstruction } from "@/lib/logic/locale";

export interface ExtractedProfileData { city?: string; course?: string; stage?: string; year?: string; gwa?: string; income?: string; chips?: string[]; summary?: string; }

export async function POST(request: Request) {
  try {
    const { text, consent, language } = (await request.json()) as { text?: string; consent?: boolean; language?: unknown };
    if (!text || typeof text !== "string" || !text.trim() || text.length > 1_600) return NextResponse.json({ error: "Enter up to 1,600 characters." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Consent is required before sending text to AI." }, { status: 400 });
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
    const result = await generateTulAIJson<ExtractedProfileData>(`Extract only these reviewed, structured profile suggestions from student text. Do not infer sensitive attributes. Chips may only be exact values from ${JSON.stringify(CHIPS)}. ${responseLanguageInstruction(requestedLanguage(language))} Return {city?,course?,stage?,year?,gwa?,income?,chips?,summary?}. Student text: ${text}`);
    if (!result.success || !result.data) return NextResponse.json({ extracted: null, error: "Profile extraction is unavailable." });
    const data = result.data;
    data.chips = data.chips?.filter((chip) => CHIPS.includes(chip));
    return NextResponse.json({ extracted: data });
  } catch {
    return NextResponse.json({ error: "Unable to extract profile details right now." }, { status: 500 });
  }
}
