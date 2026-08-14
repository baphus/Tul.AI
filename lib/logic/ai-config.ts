import { GoogleGenAI } from '@google/genai';

export function resolveGeminiApiKey(env: NodeJS.ProcessEnv): string {
  return env.GEMINI_API_KEY ?? '';
}

export function resolveGeminiModel(env: NodeJS.ProcessEnv): string {
  return env.GEMINI_MODEL ?? 'gemini-3.6-flash';
}

export function resolveAiProvider(env: NodeJS.ProcessEnv): 'gemini' | 'openai' | 'none' {
  const provider = env.AI_PROVIDER ?? 'none';
  if (provider === 'gemini' || provider === 'openai') {
    return provider;
  }
  return 'none';
}

export const TUL_AI_SYSTEM_INSTRUCTION = `You are Tul.AI's friendly, empathetic, and highly accurate student opportunity assistant.
Tul.AI's core mission is to bridge Filipino students to scholarship opportunities.

STRICT GROUND RULES:
1. AI ASSISTS; VERIFIED INFORMATION DECIDES: Base your responses strictly on the provided scholarship records and student profile data.
2. NEVER ESTIMATE CHANCES: Do NOT estimate numeric acceptance probabilities (e.g., "80% chance"). State published eligibility requirements met vs. unknown.
3. NEVER GUARANTEE OUTCOMES: Meeting eligibility requirements does not guarantee a scholarship award; each provider decides independently.
4. UNKNOWN IS NOT NOT ELIGIBLE: Missing profile details or unpublished requirements are "unknown", never automatic disqualifiers.
5. KEEP RESPONSES GROUNDED, CONCISE, AND STUDENT-FRIENDLY: Keep answers empathetic, clear, direct, and well-structured. Use line breaks when helpful.
`;

export async function generateTulAIResponse(prompt: string, systemInstruction: string = TUL_AI_SYSTEM_INSTRUCTION) {
  const apiKey = resolveGeminiApiKey(process.env);
  const model = resolveGeminiModel(process.env);

  if (!apiKey) {
    return { success: false, error: "Missing Gemini API Key in environment variables." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return { success: true, text: response.text ?? '' };
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    return { success: false, error: "Failed to generate AI response" };
  }
}

export async function generateTulAIJson<T>(prompt: string, systemInstruction: string = TUL_AI_SYSTEM_INSTRUCTION): Promise<{ success: boolean; data?: T; error?: string }> {
  const apiKey = resolveGeminiApiKey(process.env);
  const model = resolveGeminiModel(process.env);

  if (!apiKey) {
    return { success: false, error: "Missing Gemini API Key in environment variables." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? '{}';
    const cleanText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const data = JSON.parse(cleanText) as T;
    return { success: true, data };
  } catch (error) {
    console.error("Gemini JSON Execution Error:", error);
    return { success: false, error: "Failed to parse structured AI response" };
  }
}