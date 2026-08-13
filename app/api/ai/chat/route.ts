import { NextResponse } from "next/server";

import { chatFor } from "@/lib/logic/chat";
import { answerFor, type Answer } from "@/lib/logic/answerFor";
import { DATA, type Scholarship } from "@/lib/scholarships";
import type { Profile } from "@/lib/logic/state";

type Body = {
  question: string;
  profile?: Record<string, unknown>;
};

/**
 * The chat widget's endpoint (AGENTS.md §7).
 *
 * The deterministic engine always answers first — `chatFor` composes the reply
 * from the onboarding answers, the eligibility engine and the published
 * records. The LLM, when configured, is allowed only to *rephrase that reply*
 * for a friendlier voice; it is never handed the role of deciding eligibility
 * or composing facts. If the LLM call fails, the deterministic reply is
 * returned unchanged.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const question = (body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "missing_question" }, { status: 400 });
    }

    const profile = (body.profile ?? {}) as Profile;
    const cards: Scholarship[] = DATA;

    // Source of truth, computed first and always valid.
    const deterministic: Answer = chatFor(question, profile, cards);

    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const useLlm =
      (process.env.AI_PROVIDER ?? (key ? "openai" : "none")) !== "none" && !!key;

    if (!useLlm) {
      return NextResponse.json({ answer: deterministic });
    }

    const card = findCard(question, cards);
    const fact = card ? answerFor(question, card) : null;

    const system = [
      "You are Tul.AI's chat assistant voice. A deterministic engine has already composed the answer below from the student's profile answers and published scholarship records.",
      "Rephrase it in a friendly, concise voice (max 3 sentences). Keep every fact exactly as written: names, amounts, deadlines, tones (Strong match / Good match / Possible match / Not currently eligible), and any 'unknown' caveat.",
      "Never add facts, never estimate chances, never promise an outcome. If the engine says information isn't published, keep that.",
      "Return only the rephrased text, no quotes, no JSON.",
    ].join(" ");
    const user = `Deterministic answer: "${deterministic.text}"${fact && fact.text !== deterministic.text ? `\nSupporting record fact: "${fact.text}"` : ""}`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 300,
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const msg = String(data?.choices?.[0]?.message?.content ?? "").trim();
        if (msg) {
          return NextResponse.json({ answer: { text: msg, src: deterministic.src } });
        }
      }
    } catch {
      // fall through to the deterministic reply
    }

    return NextResponse.json({ answer: deterministic });
  } catch (err) {
    return NextResponse.json({ error: "server_error", detail: String(err) }, { status: 500 });
  }
}

/** Find the programme a question names, mirroring lib/logic/chat.ts cardFor. */
function findCard(question: string, cards: Scholarship[]): Scholarship | null {
  const k = " " + question.trim().toLowerCase() + " ";
  for (const card of cards) {
    const terms = [
      card.provider.toLowerCase(),
      card.title.toLowerCase(),
      card.id.toLowerCase(),
    ];
    if (terms.some((term) => k.includes(term))) return card;
  }
  return null;
}
