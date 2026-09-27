"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SifremiUnuttum() {
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("eposta")), {
      redirectTo: `${window.location.origin}/hesap/sifre-sifirla`,
    });

    setGonderiliyor(false);

    if (error) {
      setHata("Bir şeyler ters gitti, tekrar dene.");
      return;
    }

    setGonderildi(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />

        {gonderildi ? (
          <>
            <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
              E-postanı kontrol et
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Şifreni sıfırlaman için sana bir bağlantı gönderdik. Gelen kutunu (ve spam klasörünü)
              kontrol et.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
              Şifremi unuttum
            </h1>
            <p className="mt-1 text-center text-sm text-muted">
              E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
            </p>

            <form onSubmit={gonder} className="mt-6 space-y-3">
              <input
                name="eposta"
                type="email"
                required
                autoComplete="email"
                placeholder="E-posta"
                className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              />

              {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

              <button
                type="submit"
                disabled={gonderiliyor}
                className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                {gonderiliyor ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/hesap/giris" className="font-semibold text-brand hover:underline">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
