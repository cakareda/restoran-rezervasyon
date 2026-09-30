"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function IptalKarti({
  id,
  restoranHref,
  degistir,
}: {
  id: string;
  restoranHref: string;
  degistir: boolean;
}) {
  const t = useTranslations("RezervasyonIptal");
  const router = useRouter();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [iptalEdildi, setIptalEdildi] = useState(false);

  async function iptalEt() {
    setGonderiliyor(true);
    setHata(null);

    const yanit = await fetch(`/api/rezervasyon/${id}/musteri-iptal`, { method: "POST" });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const gövde = await yanit.json().catch(() => ({}));
      setHata(gövde.hata ?? t("hataGenel"));
      return;
    }

    setIptalEdildi(true);

    if (degistir) {
      router.push(restoranHref);
    }
  }

  if (iptalEdildi && !degistir) {
    return (
      <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-muted shadow-sm">
        {t("iptalEdildiMesaj")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

      {degistir && <p className="text-sm text-muted">{t("degistirAciklama")}</p>}

      <button
        onClick={iptalEt}
        disabled={gonderiliyor}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {gonderiliyor ? t("isleniyor") : degistir ? t("degistirBtn") : t("iptalBtn")}
      </button>

      <Link
        href="/hesap/profil"
        className="block text-center text-sm font-medium text-muted hover:text-brand-dark"
      >
        {t("vazgec")}
      </Link>
    </div>
  );
}
