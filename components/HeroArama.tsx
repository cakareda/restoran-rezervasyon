"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { sehirIyelikEki } from "@/lib/turkce";
import { bugununTarihi } from "@/lib/tarih";
import {
  KonumIkonu,
  TakvimIkonu,
  SaatIkonu,
  KisiIkonu,
  AramaIkonu,
  TabakIkonu,
} from "@/components/icons";

export default function HeroArama({ semtler }: { semtler: [string, { sehir: string }][] }) {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const [sehir, setSehir] = useState("");
  const bugun = bugununTarihi();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (konum) => {
        try {
          const yanit = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${konum.coords.latitude}&lon=${konum.coords.longitude}&zoom=10`
          );
          const veri = await yanit.json();
          const bulunanSehir =
            veri?.address?.city || veri?.address?.province || veri?.address?.state;
          if (bulunanSehir) setSehir((mevcut) => (mevcut ? mevcut : bulunanSehir));
        } catch {
          // Konum servisine ulaşılamadı, genel başlıkla devam edilir.
        }
      },
      () => {},
      { timeout: 4000 }
    );
  }, []);

  const sehirEki = locale === "tr" ? sehirIyelikEki(sehir) : sehir;
  const aramaAction =
    locale === routing.defaultLocale ? "/restoranlar" : `/${locale}/restoranlar`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        <KonumIkonu className="h-3.5 w-3.5" />{" "}
        {sehir ? t("rozetSehirli", { sehir }) : t("rozetVarsayilan")}
      </p>

      <h1 className="mt-4 max-w-lg text-4xl font-extrabold leading-tight text-white sm:text-5xl">
        {sehir
          ? t.rich("baslikSehirli", {
              sehirEki,
              v: (chunks) => <span className="text-[#f0d2a8]">{chunks}</span>,
            })
          : t.rich("baslikVarsayilan", {
              v: (chunks) => <span className="text-[#f0d2a8]">{chunks}</span>,
            })}
      </h1>
      <p className="mt-3 max-w-md text-white/85">{t("aciklama")}</p>

      <form
        action={aramaAction}
        method="get"
        className="mt-8 flex max-w-3xl flex-col divide-y divide-border rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0"
      >
        <label className="flex-1 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <KonumIkonu className="h-3 w-3" /> {t("konumEtiket")}
          </span>
          <input
            type="text"
            name="sehir"
            value={sehir}
            onChange={(e) => setSehir(e.target.value)}
            placeholder={t("sehirPlaceholder")}
            className="mt-0.5 w-full border-0 p-0 text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted"
          />
        </label>

        <label className="flex-1 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <TabakIkonu className="h-3 w-3" /> {t("restoranEtiket")}
          </span>
          <input
            type="text"
            name="ara"
            placeholder={t("restoranPlaceholder")}
            className="mt-0.5 w-full border-0 p-0 text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted"
          />
        </label>

        <label className="flex-1 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <TakvimIkonu className="h-3 w-3" /> {t("tarihEtiket")}
          </span>
          <input
            type="date"
            name="tarih"
            defaultValue={bugun}
            min={bugun}
            className="mt-0.5 w-full border-0 p-0 text-sm font-semibold text-foreground outline-none"
          />
        </label>

        <label className="flex-1 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <SaatIkonu className="h-3 w-3" /> {t("saatEtiket")}
          </span>
          <input
            type="time"
            name="saat"
            defaultValue="20:00"
            className="mt-0.5 w-full border-0 p-0 text-sm font-semibold text-foreground outline-none"
          />
        </label>

        <label className="px-4 py-2.5 sm:w-24">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <KisiIkonu className="h-3 w-3" /> {t("kisiEtiket")}
          </span>
          <input
            type="number"
            name="kisi"
            min={1}
            defaultValue={2}
            className="mt-0.5 w-full border-0 p-0 text-sm font-semibold text-foreground outline-none"
          />
        </label>

        <button
          type="submit"
          className="m-1.5 flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <AramaIkonu className="h-4 w-4" /> {t("aramaBtn")}
        </button>
      </form>

      {semtler.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/70">{t("hizliSecim")}</span>
          {semtler.map(([semt]) => (
            <Link
              key={semt}
              href={`/restoranlar?semt=${encodeURIComponent(semt)}`}
              className="rounded-full bg-white/15 px-3 py-1 font-medium text-white backdrop-blur transition hover:bg-white/25"
            >
              {semt}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
