"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

function YildizSecici({
  etiket,
  deger,
  onDegis,
}: {
  etiket: string;
  deger: number;
  onDegis: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-foreground">{etiket}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((yildiz) => (
          <button
            key={yildiz}
            type="button"
            onClick={() => onDegis(yildiz)}
            className={`text-2xl leading-none transition ${
              yildiz <= deger ? "text-brand" : "text-border"
            }`}
            aria-label={`${yildiz}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function YorumFormu({ rezervasyonId }: { rezervasyonId: string }) {
  const t = useTranslations("Yorum");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [puanYemek, setPuanYemek] = useState(5);
  const [puanServis, setPuanServis] = useState(5);
  const [puanOrtam, setPuanOrtam] = useState(5);

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);

    const yanit = await fetch("/api/yorum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rezervasyonId,
        puanYemek,
        puanServis,
        puanOrtam,
        yorumMetni: form.get("yorumMetni"),
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const govde = await yanit.json().catch(() => ({}));
      setHata(govde.hata ?? t("hataGenel"));
      return;
    }

    setTamamlandi(true);
  }

  if (tamamlandi) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center shadow-sm">{t("tesekkur")}</p>
    );
  }

  return (
    <form
      onSubmit={gonder}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-xl shadow-orange-900/5"
    >
      <YildizSecici etiket={t("yemekEtiket")} deger={puanYemek} onDegis={setPuanYemek} />
      <YildizSecici etiket={t("servisEtiket")} deger={puanServis} onDegis={setPuanServis} />
      <YildizSecici etiket={t("ortamEtiket")} deger={puanOrtam} onDegis={setPuanOrtam} />

      <textarea
        name="yorumMetni"
        placeholder={t("yorumPlaceholder")}
        rows={4}
        className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
      />

      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

      <button
        type="submit"
        disabled={gonderiliyor}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {gonderiliyor ? t("gonderiliyor") : t("gonderBtn")}
      </button>
    </form>
  );
}
