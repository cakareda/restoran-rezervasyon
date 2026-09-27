import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MusteriHesapNavMusteri from "@/components/MusteriHesapNavMusteri";
import MobilMenuMusteri from "@/components/MobilMenuMusteri";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { routing, RTL_DILLER } from "@/i18n/routing";
import { SITE_SLOGAN } from "@/lib/config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "SiteNav" });
  const yon = RTL_DILLER.includes(locale) ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider locale={locale}>
      <div dir={yon} lang={locale} className="flex flex-1 flex-col">
        <SiteHeader
          LinkBileseni={Link}
          anaSayfaHref="/"
          restoranlarHref="/restoranlar"
          restoranlarMetni={t("restoranlar")}
          nasilCalisirHref="/#nasil-calisir"
          nasilCalisirMetni={t("nasilCalisir")}
          isletmeSahibiyimMetni={t("isletmeSahibiyim")}
          dilSecici={<LanguageSwitcher />}
          musteriNav={<MusteriHesapNavMusteri />}
          mobilMenu={
            <MobilMenuMusteri
              restoranlarMetni={t("restoranlar")}
              nasilCalisirMetni={t("nasilCalisir")}
              girisKayitMetni={t("girisKayitOl")}
              isletmeSahibiyimMetni={t("isletmeSahibiyim")}
            />
          }
        />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter
          LinkBileseni={Link}
          slogan={SITE_SLOGAN}
          restoranlarHref="/restoranlar"
          restoranlarMetni={t("restoranlar")}
          nasilCalisirHref="/#nasil-calisir"
          nasilCalisirMetni={t("nasilCalisir")}
          baslikMasadaki="Masadaki"
          baslikRestoranlarIcin={t("isletmeSahibiyim")}
          nedenMasadakiMetni={t("nedenMasadaki")}
          restoranGirisiMetni={t("restoranGirisi")}
          restoranKayitMetni={t("restoranKayit")}
          bizeUlasinMetni={t("bizeUlasin")}
        />
      </div>
    </NextIntlClientProvider>
  );
}
