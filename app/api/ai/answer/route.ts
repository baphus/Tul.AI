import { NextResponse } from "next/server";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "@/lib/logic/answerFor";
import { allowAiRequest, canUseLiveResearch, generateTulAIResponse } from "@/lib/logic/ai-config";
import { requestedLanguage } from "@/lib/logic/locale";

export async function POST(request: Request) {
  try {
    const { question, cardId, language } = (await request.json()) as {
      question?: string;
      cardId?: string;
      language?: unknown;
    };
    if (!question || typeof question !== "string" || !cardId || question.trim().length > 1_600) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!allowAiRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });

    const card = DATA.find((item) => item.id === cardId);
    if (!card) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });

    const responseLanguage = requestedLanguage(language);
    // The scholarship-detail Ask panel always researches when a provider is
    // configured. Other chat surfaces retain their more selective behavior.
    const liveResearch = canUseLiveResearch();
    const sourceUrls = card.sources.map((source) => source.url).filter(Boolean);
    const domains = [
      ...card.sources
      .map((source) => {
        try {
          return new URL(source.url).hostname;
        } catch {
          return null;
        }
      })
      .filter((domain): domain is string => Boolean(domain)),
      card.host,
    ].filter((domain, index, all) => Boolean(domain) && all.indexOf(domain) === index);

    // ── Build full structured context from the scholarship record ──
    // Gemini answers directly from this data — no keyword matching needed.
    // answerFor() is only used as the offline fallback when the AI is unavailable.
    const { eligibility } = card;
    const eligibilityLines: string[] = [];
    if (eligibility.special?.length)
      eligibilityLines.push("Special categories: " + eligibility.special.join(", "));
    if (eligibility.stages?.length)
      eligibilityLines.push("Eligible student stages: " + eligibility.stages.join(", "));
    if (eligibility.years?.length)
      eligibilityLines.push("Eligible year levels: " + eligibility.years.join(", "));
    if (eligibility.courses?.length)
      eligibilityLines.push(
        "Eligible courses (" + (eligibility.courseMode === "priority" ? "priority list" : "hard restriction") + "): " +
        eligibility.courses.join(", ")
      );
    if (eligibility.locations?.length)
      eligibilityLines.push("Location requirement: " + eligibility.locations.join(", "));
    if (eligibility.gwaMin !== undefined)
      eligibilityLines.push("Minimum GWA: " + eligibility.gwaMin + "%");
    if (eligibility.incomeMax !== undefined)
      eligibilityLines.push("Max monthly household income: ₱" + eligibility.incomeMax.toLocaleString("en-PH"));
    if (eligibility.school)
      eligibilityLines.push("Must be enrolled at: " + eligibility.school);

    const prompt = `You are Tul.AI's scholarship assistant. Answer the student's question using ONLY the verified scholarship data below. Never guess, fabricate, or add facts not present in this record.

=== SCHOLARSHIP RECORD ===
Provider: ${card.provider}
Program: ${card.title}
Description: ${card.back.about}

Financial Assistance: ${card.amount > 0 ? `₱${card.amount.toLocaleString("en-PH")} (${card.amountNote})` : "See provider for details"}
Application Deadline: ${card.deadline}
Verification Status: ${card.verification} — last checked ${card.lastVerified}
Official Website: ${card.host}

Eligibility Criteria (from structured record):
${eligibilityLines.length > 0 ? eligibilityLines.map((l) => "- " + l).join("\n") : "- No structured eligibility criteria published; see provider directly"}

Published Requirement Labels:
${card.rows.map((r) => "- " + r.label + ": " + r.text).join("\n")}

Required Documents:
${card.needs.map((n) => "- " + n).join("\n")}

Additional Facts:
${card.back.facts.map(([k, v]) => "- " + k + ": " + v).join("\n")}

Sources: ${card.sources.map((s) => s.url || s.name).join(", ")}
=== END RECORD ===

Research order when live research is available:
1. Start with the record's listed source URL(s): ${sourceUrls.join(", ") || "None listed"}
2. If they do not answer the question, check ${card.provider}'s official site: ${card.host}

Student question: "${question}"

Rules:
- Answer clearly and warmly in 2–4 sentences.
- Never estimate acceptance odds or guarantee an award.
- If the record doesn't cover the question, say so and direct the student to ${card.provider} at ${card.host}.
- Unknown eligibility details stay unknown — never treat a missing answer as ineligible.
${liveResearch ? "- Follow the research order above. Cite every current fact you use." : "- Do not add any facts beyond the record above."}`;

    const result = await generateTulAIResponse(prompt, {
      liveResearch,
      officialDomains: domains,
      language: responseLanguage,
      maxTokens: 800,
    });

    if (!result.success || !result.text) {
      // AI unavailable — fall back to the deterministic rule engine.
      if (result.error) console.error("[/api/ai/answer] AI unavailable:", result.error);
      const fallback = answerFor(question, card, responseLanguage);
      return NextResponse.json({
        answer: fallback,
        answerOrigin: "published-record",
        liveResearch: "unavailable",
      });
    }

    return NextResponse.json({
      answer: {
        text: result.text,
        src: card.sources[0]?.name || card.provider,
        citations: result.citations,
      },
      answerOrigin: "ai",
      liveResearch: result.searched ? "used" : "not-needed",
    });
  } catch (err) {
    console.error("[/api/ai/answer] Unhandled error:", err);
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
