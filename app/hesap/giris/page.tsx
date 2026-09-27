"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GozIkonu, GozKapaliIkonu } from "@/components/icons";
import GoogleGirisButonu from "@/components/GoogleGirisButonu";

export default function MusteriGiris() {
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
      setHata("E-posta veya şifre hatalı.");
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
        <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">Giriş Yap</h1>
        <p className="mt-1 text-center text-sm text-muted">Bilgilerin otomatik dolsun.</p>

        <div className="mt-6">
          <GoogleGirisButonu metin="Google ile devam et" />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted">
          <div className="h-px flex-1 bg-border" />
          veya
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={girisYap} className="space-y-3">
          <input
            name="eposta"
            type="email"
            required
            autoComplete="email"
            placeholder="E-posta"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <div className="relative">
            <input
              name="sifre"
              type={sifreGorunur ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Şifre"
              className="w-full rounded-xl border-0 px-3.5 py-2.5 pr-10 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setSifreGorunur((v) => !v)}
              aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {sifreGorunur ? <GozKapaliIkonu className="h-4.5 w-4.5" /> : <GozIkonu className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className="text-right">
            <Link href="/hesap/sifremi-unuttum" className="text-xs font-medium text-muted hover:text-brand-dark">
              Şifremi unuttum
            </Link>
          </div>

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Hesabın yok mu?{" "}
          <Link href="/hesap/kayit" className="font-semibold text-brand hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
