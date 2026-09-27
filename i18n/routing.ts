import { defineRouting } from "next-intl/routing";

export const DILLER = ["tr", "en", "de", "es", "fr", "it", "ar", "ru"] as const;

export const DIL_ADLARI: Record<(typeof DILLER)[number], string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  ar: "العربية",
  ru: "Русский",
};

export const RTL_DILLER: readonly string[] = ["ar"];

export const routing = defineRouting({
  locales: DILLER,
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false,
});
