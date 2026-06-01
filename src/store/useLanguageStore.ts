import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, translations } from "@/lib/i18n/translations";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang) => set({ language: lang }),
      t: (key, params) => {
        const lang = get().language;
        // Check if key exists in current language, fallback to English
        const langDict = translations[lang] as Record<string, string>;
        const fallbackDict = translations["en"] as Record<string, string>;
        
        let text = langDict[key] || fallbackDict[key] || key;
        
        if (params) {
          Object.keys(params).forEach((paramKey) => {
            text = text.replace(`{${paramKey}}`, String(params[paramKey]));
          });
        }
        
        return text;
      },
    }),
    {
      name: "smart-planner-language",
    }
  )
);
