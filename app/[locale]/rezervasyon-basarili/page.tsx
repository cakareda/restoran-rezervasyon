import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { OnayIkonu, TakvimIkonu, SaatIkonu, KisiIkonu } from "@/components/icons";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function RezervasyonBasarili({
  searchParams,
}: {
  searchParams: Promise<{ restoran?: string; tarih?: string; saat?: string; kisi?: string }>;
}) {
  const t = await getTranslations("RezervasyonBasarili");
  const locale = await getLocale();
  const { restoran, tarih, saat, kisi } = await searchParams;

  const tarihMetni =
    tarih &&
    new Date(`${tarih}T00:00:00`).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      weekday: "long",
    });

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-orange-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <OnayIkonu className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-foreground">{t("baslik")}</h1>
        <p className="mt-3 text-muted">{t("aciklama")}</p>

        {restoran && (
          <div className="mt-5 space-y-1.5 rounded-xl bg-brand-light px-4 py-3.5 text-left text-sm">
            <p className="font-bold text-foreground">{restoran}</p>
            {tarihMetni && (
              <p className="flex items-center gap-1.5 text-foreground">
                <TakvimIkonu className="h-4 w-4 text-muted" />
                {tarihMetni}
              </p>
            )}
            {saat && (
              <p className="flex items-center gap-1.5 text-foreground">
                <SaatIkonu className="h-4 w-4 text-muted" />
                {saat}
              </p>
            )}
            {kisi && (
              <p className="flex items-center gap-1.5 text-foreground">
                <KisiIkonu className="h-4 w-4 text-muted" />
                {t("kisiSayisi", { sayi: kisi })}
              </p>
            )}
          </div>
        )}

        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("anaSayfayaDon")}
        </Link>
      </div>
    </div>
  );
}
