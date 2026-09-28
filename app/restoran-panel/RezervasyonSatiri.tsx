"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RezervasyonDurum, RezervasyonKaynagi } from "@/lib/types";
import { TakvimIkonu, TelefonIkonu } from "@/components/icons";

const kaynakEtiketi: Record<RezervasyonKaynagi, string> = {
  online: "Online",
  telefon: "Telefon",
};

const durumEtiketi: Record<RezervasyonDurum, string> = {
  beklemede: "Beklemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  iptal_edildi: "Misafir iptal etti",
};

const durumStil: Record<RezervasyonDurum, string> = {
  beklemede: "bg-amber-50 text-amber-700",
  onaylandi: "bg-green-50 text-green-700",
  reddedildi: "bg-red-50 text-red-700",
  iptal_edildi: "bg-zinc-100 text-zinc-500",
};

export default function RezervasyonSatiri({
  id,
  misafirAd,
  misafirEposta,
  misafirTelefon,
  kaynak,
  tarihSaat,
  kisiSayisi,
  durum,
  geldiMi,
  notlar,
}: {
  id: string;
  misafirAd: string;
  misafirEposta: string;
  misafirTelefon?: string;
  kaynak: RezervasyonKaynagi;
  tarihSaat: string;
  kisiSayisi: number;
  durum: RezervasyonDurum;
  geldiMi: boolean | null;
  notlar?: string | null;
}) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  async function eylemCagir(url: string, gövde?: object) {
    setYukleniyor(true);
    await fetch(url, {
      method: "POST",
      headers: gövde ? { "Content-Type": "application/json" } : undefined,
      body: gövde ? JSON.stringify(gövde) : undefined,
    });
    setYukleniyor(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{misafirAd}</p>
          <p className="text-sm text-muted">{misafirEposta || misafirTelefon}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <TakvimIkonu className="h-4 w-4 text-muted" />
            {new Date(tarihSaat).toLocaleString("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {kisiSayisi} kişi
          </p>
          {notlar && (
            <p className="mt-2 inline-flex max-w-md items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
              📝 {notlar}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
            {kaynakEtiketi[kaynak]}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${durumStil[durum]}`}>
            {durumEtiketi[durum]}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {durum === "beklemede" && (
          <>
            <button
              disabled={yukleniyor}
              onClick={() => eylemCagir(`/api/rezervasyon/${id}/onayla`)}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              disabled={yukleniyor}
              onClick={() => eylemCagir(`/api/rezervasyon/${id}/reddet`)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
            >
              Reddet
            </button>
          </>
        )}
        {misafirTelefon && (
          <a
            href={`tel:${misafirTelefon}`}
            aria-label="Misafiri ara"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-zinc-50"
          >
            <TelefonIkonu className="h-4 w-4" />
          </a>
        )}

        {durum === "onaylandi" && geldiMi === null && (
          <>
            <button
              disabled={yukleniyor}
              onClick={() =>
                eylemCagir(`/api/rezervasyon/${id}/gelis-durumu`, { geldiMi: true })
              }
              className="rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Geldi
            </button>
            <button
              disabled={yukleniyor}
              onClick={() =>
                eylemCagir(`/api/rezervasyon/${id}/gelis-durumu`, { geldiMi: false })
              }
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
            >
              Gelmedi
            </button>
          </>
        )}

        {durum === "onaylandi" && geldiMi !== null && (
          <span className="text-sm text-muted">
            {geldiMi ? "✓ Misafir geldi" : "✗ Misafir gelmedi"}
          </span>
        )}
      </div>
    </div>
  );
}
