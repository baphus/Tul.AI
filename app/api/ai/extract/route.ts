import { NextResponse } from "next/server";
import { z } from "zod";
import { allowAiRequest, generateTulAIJson } from "@/lib/logic/ai-config";
import { CHIPS } from "@/lib/scholarships";
import { requestedLanguage, responseLanguageInstruction } from "@/lib/logic/locale";

export interface ExtractedProfileData { city?: string; course?: string; stage?: string; year?: string; gwa?: string; income?: string; chips?: string[]; summary?: string; }

const extractedProfileSchema = z.object({
  city: z.string().trim().min(1).max(120).optional(),
  course: z.string().trim().min(1).max(160).optional(),
  stage: z.string().trim().min(1).max(80).optional(),
  year: z.string().trim().min(1).max(80).optional(),
  gwa: z.string().trim().regex(/^\d{1,3}(?:\.\d{1,2})?$/).optional(),
  income: z.string().trim().max(80).optional(),
  chips: z.array(z.string()).max(CHIPS.length).optional(),
  summary: z.string().trim().max(320).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const { text, consent, language } = (await request.json()) as { text?: string; consent?: boolean; language?: unknown };
    if (!text || typeof text !== "string" || !text.trim() || text.length > 1_600) return NextResponse.json({ error: "Enter up to 1,600 characters." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Consent is required before sending text to AI." }, { status: 400 });
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
    const result = await generateTulAIJson<ExtractedProfileData>(`Extract only these reviewed, structured profile suggestions from student text. Do not infer sensitive attributes. Chips may only be exact values from ${JSON.stringify(CHIPS)}. ${responseLanguageInstruction(requestedLanguage(language))} Return {city?,course?,stage?,year?,gwa?,income?,chips?,summary?}. Student text: ${text}`);
    if (!result.success || !result.data) return NextResponse.json({ extracted: null, error: "Profile extraction is unavailable." });
    const parsed = extractedProfileSchema.safeParse(result.data);
    if (!parsed.success) return NextResponse.json({ extracted: null, error: "Profile extraction returned an invalid proposal." });
    const data = parsed.data;
    data.chips = data.chips?.filter((chip) => CHIPS.includes(chip));
    return NextResponse.json({ extracted: data });
  } catch {
    return NextResponse.json({ error: "Unable to extract profile details right now." }, { status: 500 });
  }
}
