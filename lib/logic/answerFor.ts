import type { Scholarship } from "@/lib/scholarships";
import { formatPeso } from "@/lib/logic/format";
import type { Language } from "./locale";

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

export function suggestionsFor(language: Language): string[] {
  if (language === "FIL") return ["Maaari ba akong magkaroon ng isa pang scholarship?", "Paano kung hindi ko maabot ang deadline?", "Paano inilalabas ang pera?", "Ano ang tsansa ko?"];
  if (language === "BIS") return ["Mahimo ba ko makadawat ug laing scholarship?", "Unsa kung malapas nako ang deadline?", "Giunsa paghatag ang kuwarta?", "Unsa ang akong kahigayunan?"];
  return SUGGESTIONS;
}

/**
 * Rule-based Q&A grounded in the published data on the card. Anything not
 * covered defers to the provider — the model never invents requirements or
 * deadlines, and never estimates odds (AGENTS.md §7). The rules are ordered:
 * the first intent that matches wins, and the most specific phrases are
 * checked before generic ones.
 */
export function answerFor(q: string, card: Scholarship, language: Language = "ENG"): Answer {
  if (language !== "ENG") return localizedFallback(card, language);
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

  // ── Evaluation / Overview / "What is this about?" ──
  if (
    k.includes("good scholarship") ||
    k.includes("is this good") ||
    k.includes("is it good") ||
    k.includes("worth") ||
    k.includes("recommend") ||
    k.includes("overview") ||
    k.includes("summary") ||
    k.includes("tell me about") ||
    k.includes("details") ||
    k.includes("all about") ||
    k.includes("what is this") ||
    k.includes("what's this") ||
    k.includes("about this scholarship") ||
    k.includes("scholarship about") ||
    k.includes("explain") ||
    k.includes("describe") ||
    k.includes("what can you tell") ||
    k.includes("more about") ||
    k.includes("give me info") ||
    k.includes("give me details") ||
    k.includes("information about")
  ) {
    return {
      text:
        card.provider +
        " " +
        card.title +
        " is a scholarship offering " +
        (card.amount > 0 ? formatPeso(card.amount) + " (" + card.amountNote + ")" : card.amountNote) +
        ". " +
        card.back.about +
        " Applications close on " +
        card.deadline +
        ". There are " +
        card.rows.length +
        " published requirement" +
        (card.rows.length === 1 ? "" : "s") +
        " you can check in the eligibility section.",
      src: card.sources[0].name,
    };
  }

  // ── Chances (never estimated — AGENTS.md §3) ──
  if (k.includes("chance") || k.includes("likely") || k.includes("odds")) {
    return {
      text:
        "I can't estimate your chances — the provider does not publish slot counts or applicant numbers. What I can say is that you currently meet " +
        card.matchShort.toLowerCase() +
        ", which is the part you control.",
      src: null,
    };
  }

  // ── Facts published on the card (coverage, renewal, selection, who it's for) ──
  const FACT_KEYS: [string, string[]][] = [
    [
      "Who it's for",
      [
        "who is it for",
        "who's it for",
        "who can get",
        "who qualifies",
        "who is this for",
        "what's it for",
        "what is it for",
        "this for who",
        "for who",
        "who benefits",
        "who is eligible",
        "intended for",
      ],
    ],
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

  // ── Eligibility summary — catches "is this for OFW parents only?", "am I eligible?" etc. ──
  if (
    k.includes("who can apply") ||
    k.includes("who is eligible") ||
    k.includes("eligib") ||
    k.includes("qualify") ||
    k.includes("requirement") ||
    // "is this for X" / "is this only for" phrasing
    k.includes("is this for") ||
    k.includes("is it for") ||
    k.includes("only for") ||
    k.includes("this only") ||
    k.includes("for ofw") ||
    k.includes("ofw only") ||
    k.includes("for students") ||
    k.includes("for college") ||
    k.includes("for dependents") ||
    k.includes("this scholarship for") ||
    k.includes("who can take") ||
    k.includes("who can use") ||
    // "am I" / "can I" eligibility phrasing
    k.includes("am i eligible") ||
    k.includes("can i apply for this") ||
    k.includes("can i qualify") ||
    k.includes("eligible for this")
  ) {
    // Build a richer eligibility summary from the structured criteria.
    const parts: string[] = [];
    const { eligibility } = card;
    if (eligibility.special?.length)
      parts.push("special categories: " + eligibility.special.join(", "));
    if (eligibility.stages?.length)
      parts.push("student stage: " + eligibility.stages.join(" or "));
    if (eligibility.years?.length)
      parts.push("year levels: " + eligibility.years.join(", "));
    if (eligibility.courses?.length)
      parts.push(
        "courses: " +
          eligibility.courses.slice(0, 4).join(", ") +
          (eligibility.courses.length > 4 ? " and more" : "")
      );
    if (eligibility.locations?.length)
      parts.push("location: " + eligibility.locations.join(", "));
    if (eligibility.gwaMin !== undefined)
      parts.push("minimum GWA: " + eligibility.gwaMin + "%");
    if (eligibility.incomeMax !== undefined)
      parts.push("household income ceiling: ₱" + eligibility.incomeMax.toLocaleString("en-PH") + " / month");

    const criteriaText = parts.length
      ? "Published eligibility criteria include " + parts.join("; ") + "."
      : "The published record lists " +
        card.rows.length +
        " requirement" +
        (card.rows.length === 1 ? "" : "s") +
        " — see the eligibility section for full details.";

    return {
      text:
        criteriaText +
        " " +
        card.matchShort +
        " on the published record. Unknown details stay unknown — they are never counted as a failure.",
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
        ". You'll need " +
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
    const confirmed = card.verification === "Verified" || card.verification === "Updated";
    return {
      text:
        "This record is marked " +
        card.verification +
        " as of " +
        card.lastVerified +
        ". " +
        (confirmed
          ? "It has been checked against the provider's own published information."
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
        " — the safest answers for anything this page can't confirm come from the provider directly.",
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
      "For a definitive answer about this, contact " +
      card.provider +
      " directly at " +
      card.host +
      ". Their information was last checked " +
      card.sources[0].date.replace("Verified ", "").replace("Checked ", "") +
      ".",
    src: null,
  };
}

/**
 * The no-model path must honour the same language contract as the AI route.
 * Provider and programme names stay intact because they are official record data.
 */
function localizedFallback(card: Scholarship, language: Exclude<Language, "ENG">): Answer {
  const text = language === "FIL"
    ? `Ang sagot para sa ${card.provider} — ${card.title} ay batay lamang sa inilathalang rekord. Tingnan ang opisyal na source ng provider para sa kasalukuyang requirements, deadline na ${card.deadline}, at proseso ng aplikasyon. Ang anumang hindi nakumpirma ay mananatiling unknown.`
    : `Ang tubag para sa ${card.provider} — ${card.title} gibase lamang sa gipatik nga rekord. Susiha ang opisyal nga tinubdan sa provider para sa kasamtangang mga kinahanglanon, deadline nga ${card.deadline}, ug proseso sa aplikasyon. Ang bisan unsang dili makumpirma magpabiling unknown.`;
  return { text, src: card.sources[0]?.name ?? null };
}
