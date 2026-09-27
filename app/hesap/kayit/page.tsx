"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GozIkonu, GozKapaliIkonu } from "@/components/icons";
import GoogleGirisButonu from "@/components/GoogleGirisButonu";

export default function MusteriKayit() {
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [epostaOnayBekleniyor, setEpostaOnayBekleniyor] = useState(false);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  async function kayitOl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);
    const eposta = String(form.get("eposta"));
    const adSoyad = String(form.get("adSoyad"));
    const telefon = String(form.get("telefon") ?? "");

    const { data, error } = await supabase.auth.signUp({
      email: eposta,
      password: String(form.get("sifre")),
    });

    if (error || !data.user) {
      setGonderiliyor(false);
      setHata(error?.message === "User already registered" ? "Bu e-posta zaten kayıtlı." : "Kayıt oluşturulamadı.");
      return;
    }

    await fetch("/api/hesap/olustur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authUserId: data.user.id, adSoyad, eposta, telefon }),
    });

    setGonderiliyor(false);

    if (!data.session) {
      setEpostaOnayBekleniyor(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (epostaOnayBekleniyor) {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl shadow-red-900/5">
          <h1 className="text-xl font-extrabold text-foreground">E-postanı kontrol et</h1>
          <p className="mt-2 text-sm text-muted">
            Hesabını onaylamak için sana gönderdiğimiz bağlantıya tıkla, ardından giriş yapabilirsin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">Hesap Oluştur</h1>
        <p className="mt-1 text-center text-sm text-muted">
          Bilgilerin kaydedilsin, her seferinde yeniden yazma.
        </p>

        <div className="mt-6">
          <GoogleGirisButonu metin="Google ile devam et" />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted">
          <div className="h-px flex-1 bg-border" />
          veya
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={kayitOl} className="space-y-3">
          <input
            name="adSoyad"
            type="text"
            required
            autoComplete="name"
            placeholder="Ad Soyad"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <input
            name="eposta"
            type="email"
            required
            autoComplete="email"
            placeholder="E-posta"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <input
            name="telefon"
            type="tel"
            autoComplete="tel"
            placeholder="Telefon (opsiyonel)"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <div className="relative">
            <input
              name="sifre"
              type={sifreGorunur ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Şifre (en az 6 karakter)"
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

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? "Kaydediliyor..." : "Hesap Oluştur"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Zaten hesabın var mı?{" "}
          <Link href="/hesap/giris" className="font-semibold text-brand hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
