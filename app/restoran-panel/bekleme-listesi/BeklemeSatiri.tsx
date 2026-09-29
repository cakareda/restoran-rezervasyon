"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BeklemeKaydi } from "@/lib/types";
import { TelefonIkonu } from "@/components/icons";

const durumEtiketi: Record<BeklemeKaydi["durum"], string> = {
  bekliyor: "Bekliyor",
  iletildi: "İletildi",
  iptal: "İptal",
};

const durumStil: Record<BeklemeKaydi["durum"], string> = {
  bekliyor: "bg-amber-50 text-amber-700",
  iletildi: "bg-green-50 text-green-700",
  iptal: "bg-zinc-100 text-zinc-500",
};

export default function BeklemeSatiri({ kayit }: { kayit: BeklemeKaydi }) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  async function durumGuncelle(durum: BeklemeKaydi["durum"]) {
    setYukleniyor(true);
    await fetch(`/api/bekleme-listesi/${kayit.id}/durum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum }),
    });
    setYukleniyor(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{kayit.ad_soyad}</p>
          <p className="text-sm text-muted">{kayit.eposta}</p>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {new Date(`${kayit.tarih}T00:00:00`).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
            })}{" "}
            · {kayit.saat.slice(0, 5)} · {kayit.kisi_sayisi} kişi
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${durumStil[kayit.durum]}`}>
          {durumEtiketi[kayit.durum]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {kayit.telefon && (
          <a
            href={`tel:${kayit.telefon}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-zinc-50"
            aria-label="Misafiri ara"
          >
            <TelefonIkonu className="h-4 w-4" />
          </a>
        )}
        {kayit.durum === "bekliyor" && (
          <>
            <button
              disabled={yukleniyor}
              onClick={() => durumGuncelle("iletildi")}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Yer buldum, ilettim
            </button>
            <button
              disabled={yukleniyor}
              onClick={() => durumGuncelle("iptal")}
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
            >
              Kaldır
            </button>
          </>
        )}
      </div>
    </div>
  );
}
