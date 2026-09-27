"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RestoranKayit() {
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [epostaOnayBekleniyor, setEpostaOnayBekleniyor] = useState(false);

  async function kayitOl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);

    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("eposta")),
      password: String(form.get("sifre")),
    });

    setGonderiliyor(false);

    if (error || !data.user) {
      setHata(
        error?.message === "User already registered"
          ? "Bu e-posta zaten kayıtlı."
          : "Kayıt oluşturulamadı."
      );
      return;
    }

    if (!data.session) {
      setEpostaOnayBekleniyor(true);
      return;
    }

    router.push("/restoran-panel/restoranim");
    router.refresh();
  }

  if (epostaOnayBekleniyor) {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl shadow-red-900/5">
          <h1 className="text-xl font-extrabold text-foreground">E-postanı kontrol et</h1>
          <p className="mt-2 text-sm text-muted">
            Hesabını onaylamak için sana gönderdiğimiz bağlantıya tıkla, ardından giriş yapıp
            restoran profilini oluşturabilirsin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
        <h1 className="text-2xl font-extrabold text-foreground">Restoranını Ekle</h1>
        <p className="mt-1 text-sm text-muted">
          Hesabını oluştur, ardından restoranını Google&apos;da arayarak saniyeler içinde
          profilini doldur.
        </p>

        <form onSubmit={kayitOl} className="mt-6 space-y-3">
          <input
            name="eposta"
            type="email"
            required
            placeholder="E-posta"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <input
            name="sifre"
            type="password"
            required
            minLength={6}
            placeholder="Şifre (en az 6 karakter)"
            className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? "Oluşturuluyor..." : "Hesap Oluştur"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Zaten hesabın var mı?{" "}
          <Link href="/restoran-girisi" className="font-semibold text-brand hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
