"use client";

import { useSyncExternalStore } from "react";

import type { Language } from "@/lib/logic/locale";
import { translations, type TranslationKey } from "@/lib/logic/translations";

export type { Language } from "@/lib/logic/locale";

export const LANGUAGE_STORAGE_KEY = "tul-ai-language";
const LANGUAGE_CHANGE_EVENT = "tul-ai-language-change";

function readLanguage(): Language {
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "FIL" ? "FIL" : "ENG";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

/** The site-wide language preference. `FIL` means Filipino (Tagalog). */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, readLanguage, () => "ENG");
}

export function setLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language === "FIL" ? "fil" : "en";
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

export function useTranslation() {
  const language = useLanguage();
  return {
    language,
    t: (key: TranslationKey) => translations[language][key],
  };
}
