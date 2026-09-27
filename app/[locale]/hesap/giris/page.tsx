"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { GozIkonu, GozKapaliIkonu } from "@/components/icons";
import GoogleGirisButonu from "@/components/GoogleGirisButonu";

export default function MusteriGiris() {
  const t = useTranslations("HesapGiris");
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  async function girisYap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("eposta")),
      password: String(form.get("sifre")),
    });

    setGonderiliyor(false);

    if (error) {
      setHata(t("hataGiris"));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">{t("baslik")}</h1>
        <p className="mt-1 text-center text-sm text-muted">{t("altYazi")}</p>

        <div className="mt-6">
          <GoogleGirisButonu metin={t("googleDevam")} />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted">
          <div className="h-px flex-1 bg-border" />
          {t("veya")}
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={girisYap} className="space-y-3">
          <input
            name="eposta"
            type="email"
            required
            autoComplete="email"
            placeholder={t("epostaPlaceholder")}
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <div className="relative">
            <input
              name="sifre"
              type={sifreGorunur ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder={t("sifrePlaceholder")}
              className="w-full rounded-xl border-0 px-3.5 py-2.5 pr-10 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setSifreGorunur((v) => !v)}
              aria-label={sifreGorunur ? t("sifreyiGizle") : t("sifreyiGoster")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {sifreGorunur ? <GozKapaliIkonu className="h-4.5 w-4.5" /> : <GozIkonu className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className="text-right">
            <Link href="/hesap/sifremi-unuttum" className="text-xs font-medium text-muted hover:text-brand-dark">
              {t("sifremiUnuttum")}
            </Link>
          </div>

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? t("girisYapiliyor") : t("girisYapBtn")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {t("hesabinYokMu")}{" "}
          <Link href="/hesap/kayit" className="font-semibold text-brand hover:underline">
            {t("kayitOl")}
          </Link>
        </p>
      </div>
    </div>
  );
}
