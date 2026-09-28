"use client";

import { useState } from "react";
import { GUNLER, type CalismaSaatleri, type GunSaati } from "@/lib/calismaSaatleri";

export default function CalismaSaatleriDuzenleyici({
  baslangicDeger,
  varsayilanAcilis,
  varsayilanKapanis,
  onDegis,
}: {
  baslangicDeger: CalismaSaatleri | null;
  varsayilanAcilis: string;
  varsayilanKapanis: string;
  onDegis: (yeni: CalismaSaatleri) => void;
}) {
  const [saatler, setSaatler] = useState<CalismaSaatleri>(() => {
    const baslangic: CalismaSaatleri = {};
    for (const g of GUNLER) {
      baslangic[g.key] = baslangicDeger?.[g.key] ?? {
        acilis: varsayilanAcilis,
        kapanis: varsayilanKapanis,
        kapali: false,
      };
    }
    return baslangic;
  });

  function guncelle(gun: (typeof GUNLER)[number]["key"], degisiklik: Partial<GunSaati>) {
    setSaatler((mevcut) => {
      const yeni = {
        ...mevcut,
        [gun]: { ...mevcut[gun], ...degisiklik } as GunSaati,
      };
      onDegis(yeni);
      return yeni;
    });
  }

  return (
    <div className="space-y-2">
      {GUNLER.map((g) => {
        const gunSaati = saatler[g.key]!;
        return (
          <div
            key={g.key}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3.5 py-2.5"
          >
            <span className="w-24 shrink-0 text-sm font-semibold text-foreground">
              {g.etiket}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={gunSaati.kapali}
                onChange={(e) => guncelle(g.key, { kapali: e.target.checked })}
                className="accent-brand"
              />
              Kapalı
            </label>
            {!gunSaati.kapali && (
              <>
                <input
                  type="time"
                  value={gunSaati.acilis}
                  onChange={(e) => guncelle(g.key, { acilis: e.target.value })}
                  className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
                />
                <span className="text-muted">—</span>
                <input
                  type="time"
                  value={gunSaati.kapanis}
                  onChange={(e) => guncelle(g.key, { kapanis: e.target.value })}
                  className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
