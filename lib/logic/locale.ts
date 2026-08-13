export type Language = "ENG" | "FIL";

/** Only accept locales that this product explicitly supports at its API boundary. */
export function requestedLanguage(value: unknown): Language {
  return value === "FIL" ? "FIL" : "ENG";
}

export function responseLanguageInstruction(language: Language): string {
  return language === "FIL"
    ? "Respond entirely in natural Filipino (Tagalog). Keep official programme names, provider names, links, and exact published requirements unchanged; translate only the explanation around them."
    : "Respond in English.";
}
