"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

function telefonNormalleştir(ham: string) {
  const rakamlar = ham.replace(/[^\d+]/g, "");
  if (rakamlar.startsWith("+")) return rakamlar;
  if (rakamlar.startsWith("0")) return `+90${rakamlar.slice(1)}`;
  if (rakamlar.startsWith("90")) return `+${rakamlar}`;
  return `+90${rakamlar}`;
}

export default function TelefonGirisFormu() {
  const t = useTranslations("TelefonGiris");
  const router = useRouter();
  const supabase = createClient();

  const [asama, setAsama] = useState<"telefon" | "kod">("telefon");
  const [telefon, setTelefon] = useState("");
  const [kod, setKod] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kodGonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const normalTelefon = telefonNormalleştir(telefon);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalTelefon });

    setGonderiliyor(false);
    if (error) {
      setHata(t("hataKod"));
      return;
    }
    setTelefon(normalTelefon);
    setAsama("kod");
  }

  async function kodDogrula(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: telefon,
      token: kod,
      type: "sms",
    });

    if (error || !data.user) {
      setGonderiliyor(false);
      setHata(t("hataDogrulama"));
      return;
    }

    await fetch("/api/hesap/olustur-telefon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authUserId: data.user.id, telefon }),
    });

    setGonderiliyor(false);
    router.push("/");
    router.refresh();
  }

  if (asama === "kod") {
    return (
      <form onSubmit={kodDogrula} className="space-y-3">
        <p className="text-xs text-muted">{t("kodGonderildi", { telefon })}</p>
        <input
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t("kodPlaceholder")}
          className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
        />
        {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}
        <button
          type="submit"
          disabled={gonderiliyor}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {gonderiliyor ? t("dogrulaniyor") : t("kodDogrula")}
        </button>
        <button
          type="button"
          onClick={() => {
            setAsama("telefon");
            setKod("");
            setHata(null);
          }}
          className="w-full text-center text-xs font-semibold text-muted hover:text-brand-dark"
        >
          {t("numarayiDegistir")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={kodGonder} className="space-y-3">
      <input
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        type="tel"
        required
        autoComplete="tel"
        placeholder={t("telefonPlaceholder")}
        className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
      />
      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}
      <button
        type="submit"
        disabled={gonderiliyor}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-zinc-50 disabled:opacity-50"
      >
        {gonderiliyor ? t("kodGonderiliyor") : t("kodGonder")}
      </button>
    </form>
  );
}
