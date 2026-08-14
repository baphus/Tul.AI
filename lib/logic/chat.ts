import type { Scholarship } from "@/lib/scholarships";

import { answerFor, type Answer } from "./answerFor";
import { formatPeso } from "./format";
import { matchScholarship, rankScholarships, TONE_LABEL } from "./matching";
import { isProfileReady } from "./validation";
import type { Profile } from "./state";

/**
 * The small, grounded chat engine behind the "Ask Tul.AI" widget.
 *
 * "Not a strong one" by design: every reply is composed from the same
 * deterministic pieces the rest of the app uses — the onboarding answers
 * (`Profile`), the eligibility engine (`matching.ts`) and the per-scholarship
 * rule set (`answerFor.ts`). The LLM route (`/api/ai/chat`) may phrase these
 * for the user, but this engine is the fallback and the source of truth: it
 * never estimates chances, never guarantees an outcome, and never answers from
 * outside the provided profile + published records (AGENTS.md §3, §7).
 */

export const CHAT_SUGGESTIONS = [
  "What can I apply for?",
  "Am I eligible for DOST?",
  "Which scholarship closes soonest?",
  "What do you know about me?",
];

const PROFILE_LABELS: [keyof Profile, string][] = [
  ["city", "where you're studying"],
  ["course", "what you're studying"],
  ["school", "your school"],
  ["stage", "your student status"],
  ["year", "your year level"],
  ["gwa", "your GWA"],
  ["income", "your household income"],
  ["dependents", "your household size"],
  ["chips", "special circumstances"],
];

/** Colloquial ways students name each programme, beside its provider/title. */
const CARD_ALIASES: Record<string, string[]> = {
  "ched-merit-scholarship": ["ched merit", "cmsp"],
  "dost-sei-undergraduate-scholarship": ["dost", "sei"],
  "owwa-education-for-dependents": ["owwa", "ofw"],
  "cebu-city-higher-education-assistance": ["cebu city"],
  "ctu-academic-excellence-grant": ["ctu", "technological university"],
  "province-of-cebu-provincial-scholarship": ["province", "provincial"],
  "ched-merit-scholarship-program-cmsp-ay-2026-2027-39": ["ched merit", "cmsp", "ched-merit"],
  "27": ["dost", "sei", "undergraduate s&t", "dost-sei"],
  "24": ["owwa", "edsp"],
  "25": ["odsp"],
  "40": ["cebu", "cebu city", "cebu province", "province", "provincial", "cp-gifts"],
  "17": ["tes", "tertiary education subsidy", "unifast"],
  "18": ["tulong dunong", "tdp"],
  "5": ["jlss", "junior level science scholarship"],
  "20": ["security bank", "sbfi"],
  "3": ["sm foundation", "sm"],
};

function cardFor(question: string, cards: Scholarship[]): Scholarship | null {
  const k = " " + question.trim().toLowerCase() + " ";

  // 1. Direct check of explicit alias terms for each card
  for (const card of cards) {
    const aliases = CARD_ALIASES[card.id] ?? [];
    if (aliases.some((alias) => k.includes(alias))) return card;
  }

  // 2. Direct substring match on provider or title
  for (const card of cards) {
    const providerLower = card.provider.toLowerCase();
    const titleLower = card.title.toLowerCase();
    if (k.includes(providerLower) || k.includes(titleLower)) return card;
  }

  // 3. Fallback keyword matching against combined text
  for (const card of cards) {
    const combined = (card.provider + " " + card.title).toLowerCase();
    if (k.includes("dost") && combined.includes("dost")) return card;
    if (k.includes("owwa") && combined.includes("owwa")) return card;
    if (k.includes("ched") && combined.includes("ched")) return card;
    if ((k.includes("cebu city") || k.includes("cebu")) && combined.includes("cebu")) return card;
  }

  return null;
}

/** Eligibility for one named programme, read off the matching engine. */
function eligibilityReply(card: Scholarship, profile: Profile): Answer {
  const result = matchScholarship(card, profile);
  const conflicts = result.checks.filter((check) => check.state === "not-met");
  const unknowns = result.checks.filter((check) => check.state === "unknown");

  const parts = [
    `${card.provider} ${card.title} is a ${TONE_LABEL[result.tone].toLowerCase()} for you based on your answers — ${result.met} of ${result.total} published requirements confirmed.`,
  ];
  if (conflicts.length > 0) {
    parts.push(
      `What stops it: ${conflicts
        .map((check) => check.label)
        .join(", ")} — that's a published requirement, not a guess.`
    );
  } else if (unknowns.length > 0) {
    parts.push(
      `${unknowns.length === 1 ? "One requirement is" : `${unknowns.length} requirements are`} still unknown: ${unknowns
        .map((check) => check.label)
        .join(", ")}. Unknown isn't a failure — add what you know on your profile.`
    );
  }
  parts.push(`Closes ${card.deadline}. ${formatPeso(card.amount)} ${card.amountNote}.`);

  return { text: parts.join(" "), src: card.sources[0]?.name ?? null };
}

/** The ranked top matches for the profile — the deterministic list, not a score. */
function bestMatchesReply(cards: Scholarship[], profile: Profile): Answer {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const top = rankScholarships(cards, profile)
    .filter((result) => result.tone !== "none")
    .slice(0, 3);

  if (top.length === 0) {
    return {
      text: "Based on your answers, none of the published programmes resolves as open for you right now. Edit your profile to add what you know — unknowns are never counted as failures.",
      src: null,
    };
  }

  const lines = top.map((result, i) => {
    const card = byId.get(result.id);
    const name = card ? `${card.provider} ${card.title}` : result.id;
    return `${i + 1}) ${name} — ${TONE_LABEL[result.tone]}${
      card ? `, ${formatPeso(card.amount)} ${card.amountNote}, closes ${card.deadline}` : ""
    }`;
  });

  return {
    text: `Based on your answers, your top open matches are: ${lines.join("; ")}. Open any of them to read the full published record.`,
    src: null,
  };
}

/** The closest deadlines, grouped to the programmes open for this profile. */
function soonestReply(cards: Scholarship[], profile: Profile): Answer {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const ranked = rankScholarships(cards, profile);
  const open = ranked.filter((result) => result.tone !== "none");
  const pool = open.length > 0 ? open : ranked;

  const soonest = pool
    .slice()
    .sort((a, b) =>
      (byId.get(a.id)?.deadlineIso ?? "").localeCompare(byId.get(b.id)?.deadlineIso ?? "")
    )
    .slice(0, 3);

  const lines = soonest.map((result) => {
    const card = byId.get(result.id);
    return `${card?.provider} ${card?.title} — closes ${card?.deadline}`;
  });

  return {
    text: `Closest deadlines${open.length > 0 ? " among the programmes open to you" : ""}: ${lines.join("; ")}. Soonest first.`,
    src: null,
  };
}

/** Echo back the structured profile answers so the student can verify them. */
function profileReply(profile: Profile): Answer {
  const parts: string[] = [];
  for (const [field, label] of PROFILE_LABELS) {
    const value = profile[field];
    if (Array.isArray(value)) {
      if (value.length > 0) parts.push(`${label}: ${value.join(", ")}`);
    } else {
      const trimmed = (value ?? "").trim();
      if (trimmed) parts.push(`${label}: ${trimmed}`);
    }
  }
  const notes = profile.notes.trim();
  if (notes) {
    parts.push(`your own notes: ${notes.length > 120 ? notes.slice(0, 120) + "…" : notes}`);
  }

  if (parts.length === 0) {
    return {
      text: "You haven't shared anything yet. Answer the onboarding questions and I'll match you from real answers instead of silence.",
      src: null,
    };
  }
  return { text: `Here's what I know from your answers: ${parts.join("; ")}.`, src: null };
}

/** Chances are never estimated — only the published buckets are reported. */
function chancesReply(cards: Scholarship[], profile: Profile): Answer {
  const ranked = rankScholarships(cards, profile);
  const strong = ranked.filter((result) => result.tone === "strong").length;
  const open = ranked.filter((result) => result.tone !== "none").length;
  return {
    text: `I can't estimate your chances — Tul.AI never does, and no provider publishes slot counts. What your answers do tell me: ${strong} of ${cards.length} programmes are a strong match and ${open} are open to you. Meeting published requirements is the part you control.`,
    src: null,
  };
}

function onboardingReply(): Answer {
  return {
    text: "I can only answer from your answers so far, and I need where you're studying and what you're studying before I can match you. Finish the two required onboarding questions, then ask me again.",
    src: null,
  };
}

/**
 * Answer a question from the profile + published records.
 *
 * Intent order matters: greeting and profile-echo never need the dataset;
 * a named programme answers from the eligibility engine (or `answerFor` for
 * factual questions like deadlines); generic match questions need a ready
 * profile; everything unresolved defers to the capability note or onboarding.
 */
export function chatFor(question: string, profile: Profile, cards: Scholarship[]): Answer {
  const q = question.trim().toLowerCase();
  const k = " " + q + " ";

  const isGreeting =
    /(^|\s)(hi|hello|hey|kumusta|good (morning|afternoon|evening))(\s|$|,|!|\?)/.test(q) ||
    k.includes("what can you do") ||
    k.includes("how do you work");
  const asksProfile =
    k.includes("what do you know about me") ||
    k.includes("my profile") ||
    k.includes("my answers") ||
    k.includes("what did i answer") ||
    k.includes("about myself");
  const asksChances =
    k.includes("chance") || k.includes("odds") || k.includes("how likely") || k.includes("will i get");
  const asksBest =
    k.includes("what can i apply") ||
    k.includes("can i apply") ||
    k.includes("eligible") ||
    k.includes("qualify") ||
    k.includes("best match") ||
    k.includes("top match") ||
    k.includes("recommend") ||
    k.includes("which scholarships") ||
    k.includes("strong match") ||
    k.includes("match me") ||
    k.includes("what are my options");
  const asksSoonest =
    k.includes("soonest") ||
    k.includes("closest deadline") ||
    k.includes("closing soon") ||
    k.includes("first to close") ||
    k.includes("which deadline") ||
    k.includes("closes first");

  if (isGreeting) {
    return {
      text: "Hi! I'm Tul.AI's little assistant. I answer from the answers you gave and the published scholarship records — I never estimate your chances. Try “What can I apply for?” or “Am I eligible for DOST?”",
      src: null,
    };
  }

  if (asksProfile) return profileReply(profile);

  const card = cardFor(q, cards);
  if (card) {
    if (asksChances) return answerFor(q, card);
    const factIntent =
      k.includes("deadline") ||
      k.includes("closes") ||
      k.includes("when") ||
      k.includes("amount") ||
      k.includes("how much") ||
      k.includes("document") ||
      k.includes("how to apply") ||
      k.includes("apply now") ||
      k.includes("what does it cover") ||
      k.includes("cover");
    if (factIntent) {
      // The rule set keys on phrases like "deadline", so rephrase a plain
      // "when does X close" into the canonical deadline question.
      const deadlineAsk = k.includes("deadline") || k.includes("closes") || k.includes("when");
      return answerFor(deadlineAsk ? "what is the deadline? " + q : q, card);
    }
    return eligibilityReply(card, profile);
  }

  if (asksChances) return chancesReply(cards, profile);
  if (asksSoonest) return soonestReply(cards, profile);
  if (asksBest) {
    return isProfileReady(profile) ? bestMatchesReply(cards, profile) : onboardingReply();
  }

  if (!isProfileReady(profile)) return onboardingReply();

  return {
    text: "I answer from your profile answers and the published records only. I can tell you what you can apply for, whether one programme fits your answers, what closes soonest, or what I know about you. If a detail isn't published, I'll say so rather than guess.",
    src: null,
  };
}
