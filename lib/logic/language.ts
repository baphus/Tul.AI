"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isLanguage, LANGUAGE_DETAILS, type Language } from "@/lib/logic/locale";
import { translations, type TranslationKey } from "@/lib/logic/translations";

export type { Language } from "@/lib/logic/locale";

export const LANGUAGE_STORAGE_KEY = "tul-ai-language";
const LANGUAGE_CHANGE_EVENT = "tul-ai-language-change";

function readLanguage(): Language {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(stored) ? stored : "ENG";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

/** The site-wide language preference, shared by every client surface and AI request. */
export function useLanguage(): Language {
  const language = useSyncExternalStore<Language>(subscribe, readLanguage, () => "ENG");
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_DETAILS[language].htmlLang;
  }, [language]);
  return language;
}

export function setLanguage(language: Language) {
  if (!isLanguage(language)) return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = LANGUAGE_DETAILS[language].htmlLang;
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

export function useTranslation() {
  const language = useLanguage();
  return {
    language,
    t: (key: TranslationKey) => translations[language][key],
  };
}
