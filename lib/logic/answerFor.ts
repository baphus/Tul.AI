import type { Scholarship } from "@/lib/scholarships";
import { formatPeso } from "@/lib/logic/format";

export interface Answer {
  text: string;
  src: string | null;
  citations?: { title: string; url: string }[];
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
 * deadlines, and never estimates odds (AGENTS.md §7). The rules are ordered:
 * the first intent that matches wins, and the most specific phrases are
 * checked before generic ones.
 */
export function answerFor(q: string, card: Scholarship): Answer {
  const k = " " + q.toLowerCase().trim() + " ";

  // ── Multiple scholarships ──
  if (k.includes("another scholarship") || k.includes("same time") || k.includes(" two ")) {
    return {
      text:
        "The published guidelines for " +
        card.provider +
        " do not allow holding a second government-funded scholarship at the same time. A university or private grant is usually fine. If you receive two offers you will likely be asked to choose one.",
      src: card.sources[0].name,
    };
  }

  // ── Deadline & schedule ──
  if (k.includes("deadline") || k.includes("miss") || k.includes("late") || k.includes(" closing")) {
    return {
      text:
        "The notice lists " +
        card.deadline +
        " as the closing date and does not mention a grace period. Late submissions are normally carried to the next cycle rather than accepted.",
      src: card.sources[0].name,
    };
  }

  // ── Money release ──
  if (k.includes("released") || k.includes("disburse") || k.includes(" paid ") || k.includes("paid ")) {
    return {
      text:
        "Funds are released through your school rather than to you directly, usually once enrollment for the term is confirmed. The published notice does not give exact release dates.",
      src: card.sources[0].name,
    };
  }

  // ── Amount / benefit ──
  if (
    k.includes("how much") ||
    k.includes("amount") ||
    k.includes("stipend") ||
    k.includes("benefit") ||
    k.includes("award") ||
    k.includes("peso") ||
    k.includes("tuition") ||
    k.includes("allowance")
  ) {
    return {
      text:
        "The published assistance is " +
        formatPeso(card.amount) +
        " " +
        card.amountNote +
        ". Amounts can change per cycle, so confirm the current figure on the official notice.",
      src: card.sources[0].name,
    };
  }

  // ── Chances (never estimated — AGENTS.md §3) ──
  if (k.includes("chance") || k.includes("likely") || k.includes("odds")) {
    return {
      text:
        "I can’t estimate your chances — the provider does not publish slot counts or applicant numbers. What I can say is that you currently meet " +
        card.matchShort.toLowerCase() +
        ", which is the part you control.",
      src: null,
    };
  }

  // ── Facts published on the card (coverage, renewal, selection, who it's for) ──
  const FACT_KEYS: [string, string[]][] = [
    ["Who it’s for", ["who is it for", "who’s it for", "who can get", "who qualifies"]],
    ["Coverage", ["what does it cover", "what is covered", "what do i get", "coverage", "what's covered"]],
    ["Renewal", ["renew", "renewal", "renewable", "maintain", "continue"]],
    ["Selection", ["selected", "selection", "chosen", "ranked", "allocated"]],
  ];
  for (const [label, keys] of FACT_KEYS) {
    if (keys.some((key) => k.includes(key))) {
      const fact = card.back.facts.find(([factLabel]) => factLabel === label);
      if (fact) {
        return {
          text: fact[1],
          src: card.sources[0].name,
        };
      }
    }
  }

  // ── Eligibility summary ──
  if (k.includes("who can apply") || k.includes("who is eligible") || k.includes("eligib") || k.includes("qualify") || k.includes("requirement")) {
    const list = card.rows.slice(0, 3).map((r) => r.label).join(", ");
    const tail = card.rows.length > 3 ? " and " + card.rows[card.rows.length - 1].label : "";
    return {
      text:
        "The published requirements are " +
        list +
        tail +
        ". " +
        card.matchShort +
        " on the published record — unknown details stay unknown, never a failure.",
      src: card.sources[0].name,
    };
  }

  // ── How to apply ──
  if (
    k.includes("how to apply") ||
    k.includes("how do i apply") ||
    k.includes("where do i apply") ||
    k.includes("application") ||
    k.includes("apply now")
  ) {
    return {
      text:
        "Applications are submitted directly with " +
        card.provider +
        " — Tul.AI never files for you. Start from the official application on " +
        card.host +
        ". You’ll need " +
        card.needs[0] +
        (card.needs[1] ? " and " + card.needs[1] : "") +
        " to get going.",
      src: card.sources[0].name,
    };
  }

  // ── Verification / trust ──
  if (
    k.includes("verified") ||
    k.includes("verification") ||
    k.includes("legit") ||
    k.includes("trust") ||
    k.includes("reliable") ||
    k.includes("up to date")
  ) {
    const confirmed =
      card.verification === "Verified" || card.verification === "Updated";
    return {
      text:
        "This record is marked " +
        card.verification +
        " as of " +
        card.lastVerified +
        ". " +
        (confirmed
          ? "It has been checked against the provider’s own published information."
          : "Some part could not be confirmed against a current source — check the provider directly.") +
        " Tul.AI is not the official portal.",
      src: card.sources[0].name,
    };
  }

  // ── Provider / contact ──
  if (
    k.includes("who offers") ||
    k.includes("who provides") ||
    k.includes("provider") ||
    k.includes("office") ||
    k.includes("contact")
  ) {
    return {
      text:
        "This programme is offered by " +
        card.provider +
        ". Their official site is " +
        card.host +
        " — the safest answers for anything this page can’t confirm come from the provider directly.",
      src: card.sources[0].name,
    };
  }

  // ── Documents ──
  if (k.includes("document") || k.includes(" need ")) {
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
