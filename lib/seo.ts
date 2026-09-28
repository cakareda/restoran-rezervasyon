import { DILLER } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";

const OG_LOCALE_ESLEME: Record<(typeof DILLER)[number], string> = {
  tr: "tr_TR",
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  ar: "ar_SA",
  ru: "ru_RU",
};

export function ogLocale(locale: string) {
  return OG_LOCALE_ESLEME[locale as (typeof DILLER)[number]] ?? "tr_TR";
}

/**
 * Verilen (locale önekisiz) yol için hreflang/canonical/x-default alternatiflerini üretir.
 * `yol` "/" (ana sayfa) ya da "/restoranlar" gibi kök yoldan başlamalı.
 */
export function dilAlternatifleri(yol: string, mevcutLocale: string) {
  const temizYol = yol === "/" ? "" : yol;
  const languages: Record<string, string> = {};

  for (const dil of DILLER) {
    languages[dil] = dil === "tr" ? `${SITE_URL}${temizYol || "/"}` : `${SITE_URL}/${dil}${temizYol}`;
  }
  languages["x-default"] = languages.tr;

  return {
    canonical: languages[mevcutLocale] ?? languages.tr,
    languages,
  };
}
