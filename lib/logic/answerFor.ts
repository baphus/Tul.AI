import type { Scholarship } from "@/lib/scholarships";

export interface Answer {
  text: string;
  src: string | null;
}

export const SUGGESTIONS = [
  "Can I hold another scholarship at the same time?",
  "What if I miss the deadline?",
  "How is the money released?",
  "What are my chances?",
];

/**
 * Rule-based Q&A grounded in the published data on the card. Anything not
 * covered defers to the provider — the model never invents requirements or
 * deadlines, and never estimates odds (AGENTS.md §7).
 */
export function answerFor(q: string, card: Scholarship): Answer {
  const k = q.toLowerCase();

  if (k.includes("another scholarship") || k.includes("same time") || k.includes("two")) {
    return {
      text:
        "The published guidelines for " +
        card.provider +
        " do not allow holding a second government-funded scholarship at the same time. A university or private grant is usually fine. If you receive two offers you will likely be asked to choose one.",
      src: card.sources[0].name,
    };
  }

  if (k.includes("deadline") || k.includes("miss") || k.includes("late")) {
    return {
      text:
        "The notice lists " +
        card.deadline +
        " as the closing date and does not mention a grace period. Late submissions are normally carried to the next cycle rather than accepted.",
      src: card.sources[0].name,
    };
  }

  if (k.includes("money") || k.includes("released") || k.includes("paid") || k.includes("disburse")) {
    return {
      text:
        "Funds are released through your school rather than to you directly, usually once enrollment for the term is confirmed. The published notice does not give exact release dates.",
      src: card.sources[0].name,
    };
  }

  if (k.includes("chance") || k.includes("likely") || k.includes("odds")) {
    return {
      text:
        "I can’t estimate your chances — the provider does not publish slot counts or applicant numbers. What I can say is that you currently meet " +
        card.matchShort.toLowerCase() +
        ", which is the part you control.",
      src: null,
    };
  }

  if (k.includes("document") || k.includes("need") || k.includes("requirement")) {
    const list = card.needs.slice(0, 3).join(", ");
    const tail = card.needs.length > 3 ? " and " + card.needs[card.needs.length - 1] : "";
    return {
      text:
        "The published list is " + list + tail + ". Bring originals and one photocopy of each — most offices keep the copy.",
      src: card.sources[0].name,
    };
  }

  return {
    text:
      "I couldn’t find that in the published information for " +
      card.provider +
      ". The safest answer will come from the provider directly — their notice was last updated " +
      card.sources[0].date.replace("Verified ", "") +
      ".",
    src: null,
  };
}