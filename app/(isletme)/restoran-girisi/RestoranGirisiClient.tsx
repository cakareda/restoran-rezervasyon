"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GozIkonu, GozKapaliIkonu } from "@/components/icons";
import RestoranAuthLayout from "@/components/RestoranAuthLayout";
import { SITE_ADI } from "@/lib/config";

export default function RestoranGirisiClient() {
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [oturumKontrolEdiliyor, setOturumKontrolEdiliyor] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/restoran-panel");
        return;
      }
      setOturumKontrolEdiliyor(false);
    });
  }, [router, supabase]);

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

    router.push("/restoran-panel");
    router.refresh();
  }

  if (oturumKontrolEdiliyor) {
    return <RestoranAuthLayout>{null}</RestoranAuthLayout>;
  }

  return (
    <RestoranAuthLayout>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
      <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
        {SITE_ADI} Restoran Girişi
      </h1>
      <p className="mt-1 text-center text-sm text-muted">
        Rezervasyon taleplerinizi yönetmek için giriş yapın.
      </p>

      <form method="post" onSubmit={girisYap} className="mt-6 space-y-3">
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
          <Link
            href="/restoran-girisi/sifremi-unuttum"
            className="text-xs font-medium text-muted hover:text-brand-dark"
          >
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
        Restoranın henüz kayıtlı değil mi?{" "}
        <Link href="/restoran-kayit" className="font-semibold text-brand hover:underline">
          Ücretsiz kayıt ol
        </Link>
      </p>
    </RestoranAuthLayout>
  );
}
