"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RestoranMasasi } from "@/lib/types";
import { MASA_ALANLARI } from "@/lib/types";
import { KapatIkonu } from "@/components/icons";
import type { BugunkuAtama } from "./page";

export default function KatPlaniClient({
  restoranId,
  masalar,
  bugunkuAtamalar,
  oturmaSuresiDk,
}: {
  restoranId: string;
  masalar: RestoranMasasi[];
  bugunkuAtamalar: BugunkuAtama[];
  oturmaSuresiDk: number;
}) {
  void restoranId;
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [surukleniyor, setSurukleniyor] = useState<string | null>(null);
  const [yerelPozisyonlar, setYerelPozisyonlar] = useState<Record<string, { x: number; y: number }>>({});
  const [eklemeAcik, setEklemeAcik] = useState(false);
  const [yeniIsim, setYeniIsim] = useState("");
  const [yeniKapasite, setYeniKapasite] = useState(4);
  const [yeniAlan, setYeniAlan] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const simdi = Date.now();

  function masaAtamalari(masaId: string) {
    return bugunkuAtamalar
      .filter((a) => a.masaId === masaId)
      .sort((a, b) => new Date(a.tarihSaat).getTime() - new Date(b.tarihSaat).getTime());
  }

  function masaDoluMu(masaId: string) {
    return masaAtamalari(masaId).some((a) => {
      const baslangic = new Date(a.tarihSaat).getTime();
      const bitis = baslangic + oturmaSuresiDk * 60 * 1000;
      return simdi >= baslangic && simdi < bitis;
    });
  }

  function pointerDown(masaId: string) {
    setSurukleniyor(masaId);
  }

  function pointerMove(e: React.PointerEvent) {
    if (!surukleniyor || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setYerelPozisyonlar((p) => ({ ...p, [surukleniyor]: { x, y } }));
  }

  async function pointerUp() {
    if (!surukleniyor) return;
    const pozisyon = yerelPozisyonlar[surukleniyor];
    const masaId = surukleniyor;
    setSurukleniyor(null);
    if (!pozisyon) return;
    await fetch(`/api/restoran-masasi/${masaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pozisyonX: pozisyon.x, pozisyonY: pozisyon.y }),
    });
    router.refresh();
  }

  async function masaEkle() {
    if (!yeniIsim.trim() || yeniKapasite < 1) return;
    setKaydediliyor(true);
    await fetch("/api/restoran-masasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isim: yeniIsim.trim(),
        kapasite: yeniKapasite,
        alan: yeniAlan,
        pozisyonX: 10 + ((masalar.length * 17) % 80),
        pozisyonY: 10 + ((Math.floor(masalar.length / 5) * 25) % 80),
      }),
    });
    setKaydediliyor(false);
    setYeniIsim("");
    setYeniKapasite(4);
    setYeniAlan("");
    setEklemeAcik(false);
    router.refresh();
  }

  async function masaSil(id: string) {
    if (!confirm("Bu masayı silmek istediğine emin misin?")) return;
    await fetch(`/api/restoran-masasi/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">
          Kutuları sürükleyip bırak — konumu otomatik kaydedilir.
        </p>
        <button
          onClick={() => setEklemeAcik((v) => !v)}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Masa ekle
        </button>
      </div>

      {eklemeAcik && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-white p-3">
          <div>
            <label className="block text-xs font-semibold text-muted">Masa adı</label>
            <input
              value={yeniIsim}
              onChange={(e) => setYeniIsim(e.target.value)}
              placeholder="Masa 1"
              className="mt-1 w-32 rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">Kapasite</label>
            <input
              type="number"
              min={1}
              value={yeniKapasite}
              onChange={(e) => setYeniKapasite(Number(e.target.value))}
              className="mt-1 w-20 rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">Alan</label>
            <select
              value={yeniAlan}
              onChange={(e) => setYeniAlan(e.target.value)}
              className="mt-1 rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            >
              {MASA_ALANLARI.map((a) => (
                <option key={a.deger} value={a.deger}>
                  {a.etiket}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={masaEkle}
            disabled={kaydediliyor}
            className="rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerLeave={pointerUp}
        className="relative mt-4 h-[480px] w-full rounded-2xl border border-dashed border-border bg-white"
      >
        {masalar.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Henüz masa eklemedin.
          </p>
        )}
        {masalar.map((masa) => {
          const pozisyon = yerelPozisyonlar[masa.id] ?? { x: masa.pozisyon_x, y: masa.pozisyon_y };
          const dolu = masaDoluMu(masa.id);
          const atamalar = masaAtamalari(masa.id);
          return (
            <div
              key={masa.id}
              onPointerDown={() => pointerDown(masa.id)}
              style={{ left: `${pozisyon.x}%`, top: `${pozisyon.y}%` }}
              className={`absolute flex w-28 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center gap-0.5 rounded-xl border-2 p-2 text-center shadow-sm active:cursor-grabbing ${
                dolu ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  masaSil(masa.id);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                aria-label="Masayı sil"
              >
                <KapatIkonu className="h-3 w-3" />
              </button>
              <span className="text-sm font-bold text-foreground">{masa.isim}</span>
              <span className="text-xs text-muted">
                {masa.kapasite} kişi{masa.alan && ` · ${MASA_ALANLARI.find((a) => a.deger === masa.alan)?.etiket ?? masa.alan}`}
              </span>
              {atamalar.length > 0 && (
                <span className="mt-1 text-[10px] font-semibold text-zinc-600">
                  {atamalar
                    .map(
                      (a) =>
                        `${new Date(a.tarihSaat).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Istanbul",
                        })} ${a.misafirAd}`
                    )
                    .join(" · ")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
