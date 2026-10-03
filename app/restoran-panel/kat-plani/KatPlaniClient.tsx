"use client";

import { useEffect, useRef, useState } from "react";
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
  const surukleniyorRef = useRef<string | null>(null);
  const yerelPozisyonlarRef = useRef<Record<string, { x: number; y: number }>>({});
  const [yerelPozisyonlar, setYerelPozisyonlar] = useState<Record<string, { x: number; y: number }>>({});
  const [eklemeAcik, setEklemeAcik] = useState(false);
  const [yeniIsim, setYeniIsim] = useState("");
  const [yeniKapasite, setYeniKapasite] = useState(4);
  const [yeniAlan, setYeniAlan] = useState("");
  const [yeniSekil, setYeniSekil] = useState<"daire" | "dikdortgen">("dikdortgen");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const mevcutAlanlar = Array.from(new Set(masalar.map((m) => m.alan).filter(Boolean)));
  const sekmeSecenekleri = [
    { deger: "genel", etiket: "Genel" },
    ...mevcutAlanlar.map((a) => ({
      deger: a,
      etiket: MASA_ALANLARI.find((m) => m.deger === a)?.etiket ?? a,
    })),
  ];
  const [aktifSekme, setAktifSekme] = useState("genel");
  const gorunenMasalar = aktifSekme === "genel" ? masalar : masalar.filter((m) => m.alan === aktifSekme);

  // Dakikada bir güncelleniyor: "kaç dk dolu" ve dolu/boş durumu sayfa yenilenmeden de ilerlesin.
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => {
    const aralik = setInterval(() => setSimdi(Date.now()), 60000);
    return () => clearInterval(aralik);
  }, []);

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

  function konumHesapla(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  }

  useEffect(() => {
    yerelPozisyonlarRef.current = yerelPozisyonlar;
  }, [yerelPozisyonlar]);

  // Sürükleme sırasında pencere genelinde dinliyoruz — işaretçi kutunun veya
  // tuvalin dışına çıksa bile sürükleme kopmuyor, daha akıcı hissettiriyor.
  useEffect(() => {
    if (!surukleniyor) return;

    function hareket(e: PointerEvent) {
      const masaId = surukleniyorRef.current;
      if (!masaId || !canvasRef.current) return;
      const konum = konumHesapla(e.clientX, e.clientY);
      setYerelPozisyonlar((p) => ({ ...p, [masaId]: konum }));
    }

    async function birak() {
      const masaId = surukleniyorRef.current;
      setSurukleniyor(null);
      if (!masaId) return;
      const pozisyon = yerelPozisyonlarRef.current[masaId];
      if (!pozisyon) return;
      await fetch(`/api/restoran-masasi/${masaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pozisyonX: pozisyon.x, pozisyonY: pozisyon.y }),
      });
      router.refresh();
    }

    window.addEventListener("pointermove", hareket);
    window.addEventListener("pointerup", birak);
    return () => {
      window.removeEventListener("pointermove", hareket);
      window.removeEventListener("pointerup", birak);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surukleniyor]);

  function suruklemeyiBaslat(e: React.PointerEvent, masaId: string) {
    e.preventDefault();
    surukleniyorRef.current = masaId;
    setSurukleniyor(masaId);
  }

  async function masaEkle() {
    if (!yeniIsim.trim() || yeniKapasite < 1) return;
    setKaydediliyor(true);
    const ayniAlandakiSayi = masalar.filter((m) => m.alan === yeniAlan).length;
    await fetch("/api/restoran-masasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isim: yeniIsim.trim(),
        kapasite: yeniKapasite,
        alan: yeniAlan,
        sekil: yeniSekil,
        pozisyonX: 12 + ((ayniAlandakiSayi * 16) % 76),
        pozisyonY: 15 + ((Math.floor(ayniAlandakiSayi / 5) * 28) % 70),
      }),
    });
    setKaydediliyor(false);
    setYeniIsim("");
    setYeniKapasite(4);
    setYeniAlan(aktifSekme !== "genel" ? aktifSekme : "");
    setEklemeAcik(false);
    router.refresh();
  }

  function suresiDoluDk(masaId: string): number | null {
    const aktif = masaAtamalari(masaId).find((a) => {
      const baslangic = new Date(a.tarihSaat).getTime();
      const bitis = baslangic + oturmaSuresiDk * 60 * 1000;
      return simdi >= baslangic && simdi < bitis;
    });
    if (!aktif) return null;
    return Math.max(0, Math.round((simdi - new Date(aktif.tarihSaat).getTime()) / 60000));
  }

  async function masaSil(id: string) {
    if (!confirm("Bu masayı silmek istediğine emin misin?")) return;
    await fetch(`/api/restoran-masasi/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const alanRenkleri: Record<string, string> = {
    salon: "bg-amber-400",
    bahce: "bg-green-500",
    teras: "bg-sky-500",
    "": "bg-zinc-400",
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">
          Kutuları sürükleyip bırak — konumu otomatik kaydedilir.
        </p>
        <button
          onClick={() => {
            if (!eklemeAcik && aktifSekme !== "genel") setYeniAlan(aktifSekme);
            setEklemeAcik((v) => !v);
          }}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Masa ekle
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {sekmeSecenekleri.map((s) => (
          <button
            key={s.deger}
            onClick={() => setAktifSekme(s.deger)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              aktifSekme === s.deger
                ? "bg-foreground text-white"
                : "bg-zinc-100 text-muted hover:bg-zinc-200"
            }`}
          >
            {s.etiket}
            {s.deger !== "genel" && (
              <span className="ml-1 opacity-70">{masalar.filter((m) => m.alan === s.deger).length}</span>
            )}
          </button>
        ))}
      </div>

      {eklemeAcik && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-white p-3 shadow-sm">
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
          <div>
            <label className="block text-xs font-semibold text-muted">Şekil</label>
            <div className="mt-1 flex rounded-lg bg-zinc-100 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setYeniSekil("dikdortgen")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${yeniSekil === "dikdortgen" ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
              >
                <span className="h-3 w-4 rounded-[3px] border-2 border-current" /> Masa
              </button>
              <button
                type="button"
                onClick={() => setYeniSekil("daire")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${yeniSekil === "daire" ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
              >
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current" /> Yuvarlak
              </button>
            </div>
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

      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Boş
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Dolu (şu an)
        </span>
      </div>

      <div
        ref={canvasRef}
        style={{
          backgroundImage: "radial-gradient(circle, #e5dfd3 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        className="relative mt-2 h-[520px] w-full overflow-hidden rounded-2xl border border-border bg-[#fcfaf6] shadow-inner"
      >
        {gorunenMasalar.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            {aktifSekme === "genel" ? "Henüz masa eklemedin." : "Bu alanda henüz masa yok."}
          </p>
        )}
        {gorunenMasalar.map((masa) => {
          const pozisyon = yerelPozisyonlar[masa.id] ?? { x: masa.pozisyon_x, y: masa.pozisyon_y };
          const dolu = masaDoluMu(masa.id);
          const atamalar = masaAtamalari(masa.id);
          const buSurukleniyor = surukleniyor === masa.id;
          const suresi = suresiDoluDk(masa.id);
          const sonrakiAtama = atamalar.find((a) => new Date(a.tarihSaat).getTime() > simdi);

          const boyut = Math.min(112, Math.max(72, 60 + masa.kapasite * 6));
          const sekilSinifi =
            masa.sekil === "daire"
              ? "rounded-full"
              : masa.kapasite >= 6
                ? "rounded-2xl"
                : "rounded-xl";
          const genislik = masa.sekil === "daire" ? boyut : masa.kapasite >= 6 ? boyut * 1.6 : boyut;

          return (
            <div
              key={masa.id}
              onPointerDown={(e) => suruklemeyiBaslat(e, masa.id)}
              style={{
                left: `${pozisyon.x}%`,
                top: `${pozisyon.y}%`,
                width: genislik,
                height: boyut,
                transition: buSurukleniyor ? "none" : "left 0.15s ease, top 0.15s ease",
                zIndex: buSurukleniyor ? 20 : 1,
              }}
              className={`group absolute flex -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center justify-center gap-0.5 border-2 p-1.5 text-center shadow-md ${sekilSinifi} ${
                dolu
                  ? "border-red-400 bg-red-50 text-red-900"
                  : "border-green-300 bg-white text-foreground hover:border-green-400"
              } ${buSurukleniyor ? "cursor-grabbing scale-105 shadow-xl" : "cursor-grab hover:shadow-lg"}`}
            >
              {masa.alan && (
                <span
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-[1px] text-[9px] font-bold text-white ${alanRenkleri[masa.alan] ?? "bg-zinc-400"}`}
                >
                  {MASA_ALANLARI.find((a) => a.deger === masa.alan)?.etiket ?? masa.alan}
                </span>
              )}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  masaSil(masa.id);
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 opacity-0 shadow-sm transition hover:bg-zinc-300 group-hover:opacity-100"
                aria-label="Masayı sil"
              >
                <KapatIkonu className="h-3 w-3" />
              </button>
              <span className="text-sm font-extrabold leading-tight">{masa.isim}</span>
              <span className="text-[11px] font-medium leading-tight opacity-80">{masa.kapasite} kişi</span>
              {dolu && suresi !== null && (
                <span className="text-[10px] font-bold leading-tight text-red-700">{suresi} dk</span>
              )}
              {!dolu && sonrakiAtama && (
                <span className="text-[10px] font-semibold leading-tight text-amber-600">
                  {new Date(sonrakiAtama.tarihSaat).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Istanbul",
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
