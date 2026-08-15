/** UI and AI response languages supported by Tul.AI. */
export type Language = "ENG" | "FIL" | "BIS";

export const LANGUAGES = ["ENG", "FIL", "BIS"] as const satisfies readonly Language[];

export const LANGUAGE_DETAILS: Record<Language, { label: string; htmlLang: string }> = {
  ENG: { label: "English", htmlLang: "en" },
  FIL: { label: "Filipino", htmlLang: "fil" },
  BIS: { label: "Bisaya", htmlLang: "ceb" },
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** Only accept locales that this product explicitly supports at its API boundary. */
export function requestedLanguage(value: unknown): Language {
  return isLanguage(value) ? value : "ENG";
}

export function responseLanguageInstruction(language: Language): string {
  switch (language) {
    case "FIL":
      return "Respond entirely in natural Filipino (Tagalog), not Bisaya/Cebuano. Keep official programme names, provider names, links, and exact published requirements unchanged; translate only the explanation around them.";
    case "BIS":
      return "Respond entirely in natural Cebuano (Bisaya), not Filipino/Tagalog. Keep official programme names, provider names, links, and exact published requirements unchanged; translate only the explanation around them.";
    default:
      return "Respond entirely in English.";
  }
}
