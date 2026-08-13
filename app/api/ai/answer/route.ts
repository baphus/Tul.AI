import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "@/lib/logic/answerFor";

type Body = {
  question: string;
  cardId: string;
  profile?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { question, cardId, profile } = body;
    const card = DATA.find((c) => c.id === cardId);
    if (!card) return NextResponse.json({ error: "card_not_found" }, { status: 404 });

    // Decide provider: explicit `AI_PROVIDER` or infer from available keys.
    const provider =
      process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : process.env.GOOGLE_API_KEY ? "google" : "none");

    // Build a compact context for the model.
    const context = {
      id: card.id,
      title: card.title,
      provider: card.provider,
      deadline: card.deadline,
      needs: card.needs,
      about: card.back?.about ?? "",
      matchShort: card.matchShort,
    };

    const system = `You are Tul.AI's grounded QA assistant. Answer the user's question using ONLY the provided scholarship facts and the student's profile when available. If the information is not in the provided facts, say you couldn't find it and point to the provider. Do not hallucinate. Keep the answer concise (1-3 sentences) and include a "source" field if the source is a provider document; otherwise set source to null.`;

    const user = `Question: ${question}\n\nScholarship: ${JSON.stringify(context)}\n\nProfile: ${JSON.stringify(profile ?? {})}`;

    // Provider: Google Generative API (Gemini-like) -> OpenAI -> deterministic fallback
    if (provider === "google" && process.env.GOOGLE_API_KEY && process.env.GOOGLE_MODEL) {
      try {
        const model = process.env.GOOGLE_MODEL;
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(
          model
        )}:generateText?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;
        const gpayload = {
          prompt: { text: `${system}\n\n${user}` },
          temperature: 0.0,
          maxOutputTokens: 300,
        };
        const gres = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gpayload),
        });
        if (gres.ok) {
          const gdata = await gres.json();
          const msg = gdata?.candidates?.[0]?.content ?? "";
          const answer = { text: String(msg).trim(), src: null as string | null };
          return NextResponse.json({ answer });
        }
        // fall through to fallback
      } catch {
        // continue to try other providers
      }
    }

    if ((provider === "openai" || provider === "auto") && process.env.OPENAI_API_KEY) {
      const key = process.env.OPENAI_API_KEY;
      const payload = {
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 300,
        temperature: 0.0,
      };

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const msg = data?.choices?.[0]?.message?.content ?? "";
          const answer = { text: String(msg).trim(), src: null as string | null };
          try {
            const parsed = JSON.parse(msg);
            if (parsed && typeof parsed === "object" && parsed.text) {
              answer.text = String(parsed.text);
              answer.src = parsed.src ?? null;
            }
          } catch {
            // raw text
          }
          return NextResponse.json({ answer });
        }
      } catch {
        // continue to fallback
      }
    }

    // Final fallback: deterministic answer
    const a = answerFor(question, card);
    return NextResponse.json({ answer: a });
  } catch (err) {
    return NextResponse.json({ error: "server_error", detail: String(err) }, { status: 500 });
  }
}
