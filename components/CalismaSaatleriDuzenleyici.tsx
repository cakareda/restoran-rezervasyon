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
    const yeni: CalismaSaatleri = {
      ...saatler,
      [gun]: { ...saatler[gun], ...degisiklik } as GunSaati,
    };
    setSaatler(yeni);
    onDegis(yeni);
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

                {gunSaati.aralik2Acilis || gunSaati.aralik2Kapanis ? (
                  <>
                    <span className="text-xs font-semibold text-brand-dark">+ 2. servis</span>
                    <input
                      type="time"
                      value={gunSaati.aralik2Acilis ?? ""}
                      onChange={(e) => guncelle(g.key, { aralik2Acilis: e.target.value })}
                      className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
                    />
                    <span className="text-muted">—</span>
                    <input
                      type="time"
                      value={gunSaati.aralik2Kapanis ?? ""}
                      onChange={(e) => guncelle(g.key, { aralik2Kapanis: e.target.value })}
                      className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        guncelle(g.key, { aralik2Acilis: undefined, aralik2Kapanis: undefined })
                      }
                      className="text-xs font-semibold text-muted hover:text-red-600"
                    >
                      Kaldır
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      guncelle(g.key, { aralik2Acilis: "18:00", aralik2Kapanis: gunSaati.kapanis })
                    }
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    + Öğle/akşam ayrı servis ekle
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
