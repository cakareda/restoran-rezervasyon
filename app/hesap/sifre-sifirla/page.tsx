"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GozIkonu, GozKapaliIkonu } from "@/components/icons";

export default function SifreSifirla() {
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  async function kaydet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.updateUser({
      password: String(form.get("sifre")),
    });

    setGonderiliyor(false);

    if (error) {
      setHata("Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir, tekrar dene.");
      return;
    }

    setBasarili(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />

        {basarili ? (
          <>
            <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
              Şifren güncellendi
            </h1>
            <p className="mt-2 text-center text-sm text-muted">Yönlendiriliyorsun...</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
              Yeni şifre belirle
            </h1>

            <form onSubmit={kaydet} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  name="sifre"
                  type={sifreGorunur ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Yeni şifre (en az 6 karakter)"
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 pr-10 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => setSifreGorunur((v) => !v)}
                  aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {sifreGorunur ? (
                    <GozKapaliIkonu className="h-4.5 w-4.5" />
                  ) : (
                    <GozIkonu className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>

              {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

              <button
                type="submit"
                disabled={gonderiliyor}
                className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                {gonderiliyor ? "Kaydediliyor..." : "Şifreyi güncelle"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
