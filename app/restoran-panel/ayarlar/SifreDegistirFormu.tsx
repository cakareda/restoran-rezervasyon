"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const girdiStil =
  "w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";

export default function SifreDegistirFormu({ eposta }: { eposta: string }) {
  const supabase = createClient();
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);

  async function degistir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setBasarili(false);

    if (yeniSifre.length < 8) {
      setHata("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setHata("Yeni şifreler birbiriyle uyuşmuyor.");
      return;
    }

    setGonderiliyor(true);

    // Mevcut şifreyi doğrulamak için yeniden giriş deniyoruz — oturum açık bir
    // cihazdan izinsiz şifre değişikliğine karşı ek güvenlik katmanı.
    const { error: dogrulamaHatasi } = await supabase.auth.signInWithPassword({
      email: eposta,
      password: mevcutSifre,
    });

    if (dogrulamaHatasi) {
      setGonderiliyor(false);
      setHata("Mevcut şifre yanlış.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: yeniSifre });

    setGonderiliyor(false);

    if (error) {
      setHata("Şifre değiştirilemedi, tekrar deneyin.");
      return;
    }

    setMevcutSifre("");
    setYeniSifre("");
    setYeniSifreTekrar("");
    setBasarili(true);
  }

  return (
    <form onSubmit={degistir} className="mt-3 space-y-2">
      <input
        type="password"
        value={mevcutSifre}
        onChange={(e) => setMevcutSifre(e.target.value)}
        placeholder="Mevcut şifre"
        autoComplete="current-password"
        required
        className={girdiStil}
      />
      <input
        type="password"
        value={yeniSifre}
        onChange={(e) => setYeniSifre(e.target.value)}
        placeholder="Yeni şifre (en az 8 karakter)"
        autoComplete="new-password"
        minLength={8}
        required
        className={girdiStil}
      />
      <input
        type="password"
        value={yeniSifreTekrar}
        onChange={(e) => setYeniSifreTekrar(e.target.value)}
        placeholder="Yeni şifre (tekrar)"
        autoComplete="new-password"
        minLength={8}
        required
        className={girdiStil}
      />

      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}
      {basarili && (
        <p className="text-sm font-medium text-green-700">✓ Şifren değiştirildi.</p>
      )}

      <button
        type="submit"
        disabled={gonderiliyor}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {gonderiliyor ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
      </button>
    </form>
  );
}
