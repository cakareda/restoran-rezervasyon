"use client";

import { useState } from "react";
import { type OzelGun } from "@/lib/calismaSaatleri";

export default function OzelGunlerDuzenleyici({
  baslangicDeger,
  onDegis,
}: {
  baslangicDeger: OzelGun[];
  onDegis: (yeni: OzelGun[]) => void;
}) {
  const [gunler, setGunler] = useState<OzelGun[]>(baslangicDeger);
  const [tarih, setTarih] = useState("");
  const [kapali, setKapali] = useState(true);
  const [acilis, setAcilis] = useState("");
  const [kapanis, setKapanis] = useState("");
  const [aciklama, setAciklama] = useState("");

  function ekle() {
    if (!tarih) return;
    const yeniGun: OzelGun = {
      tarih,
      kapali,
      acilis: kapali ? undefined : acilis || undefined,
      kapanis: kapali ? undefined : kapanis || undefined,
      aciklama: aciklama.trim() || undefined,
    };
    const yeni = [...gunler.filter((g) => g.tarih !== tarih), yeniGun].sort((a, b) =>
      a.tarih.localeCompare(b.tarih)
    );
    setGunler(yeni);
    onDegis(yeni);
    setTarih("");
    setKapali(true);
    setAcilis("");
    setKapanis("");
    setAciklama("");
  }

  function sil(hedefTarih: string) {
    const yeni = gunler.filter((g) => g.tarih !== hedefTarih);
    setGunler(yeni);
    onDegis(yeni);
  }

  return (
    <div className="space-y-2">
      {gunler.length > 0 && (
        <div className="space-y-2">
          {gunler.map((g) => (
            <div
              key={g.tarih}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm"
            >
              <span className="font-semibold text-foreground">{g.tarih}</span>
              <span className={g.kapali ? "text-red-600" : "text-foreground"}>
                {g.kapali ? "Kapalı" : `${g.acilis ?? "?"} — ${g.kapanis ?? "?"}`}
              </span>
              {g.aciklama && <span className="text-muted">({g.aciklama})</span>}
              <button
                type="button"
                onClick={() => sil(g.tarih)}
                className="ml-auto text-xs font-semibold text-muted hover:text-red-600"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-brand-light p-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tarih</label>
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
        <label className="flex items-center gap-1.5 pb-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={kapali}
            onChange={(e) => setKapali(e.target.checked)}
            className="accent-brand"
          />
          Tamamen kapalı
        </label>
        {!kapali && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Açılış</label>
              <input
                type="time"
                value={acilis}
                onChange={(e) => setAcilis(e.target.value)}
                className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Kapanış</label>
              <input
                type="time"
                value={kapanis}
                onChange={(e) => setKapanis(e.target.value)}
                className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
              />
            </div>
          </>
        )}
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">Açıklama (opsiyonel)</label>
          <input
            type="text"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="örn. Yılbaşı"
            maxLength={60}
            className="w-full rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
        <button
          type="button"
          onClick={ekle}
          disabled={!tarih}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
      <p className="text-xs text-muted">
        Belirli bir tarihte farklı saat çalışacaksan ya da tamamen kapalıysan (bayram, özel gün,
        tadilat vb.) buradan ekle — haftalık çalışma saatlerini o gün için geçersiz kılar.
      </p>
    </div>
  );
}
