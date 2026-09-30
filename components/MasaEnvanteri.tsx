"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MASA_ALANLARI, type Masa } from "@/lib/types";

export default function MasaEnvanteri({
  restoranId,
  onDegis,
}: {
  restoranId: string | null;
  onDegis?: (masalar: Masa[]) => void;
}) {
  const supabase = createClient();
  const [masalar, setMasalar] = useState<Masa[]>([]);
  const [yukleniyor, setYukleniyor] = useState(Boolean(restoranId));
  const [yeniKapasite, setYeniKapasite] = useState(2);
  const [yeniAdet, setYeniAdet] = useState(1);
  const [yeniAlan, setYeniAlan] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!restoranId) return;
    async function yukle() {
      const { data } = await supabase
        .from("masalar")
        .select("*")
        .eq("restoran_id", restoranId)
        .order("kapasite");
      setMasalar(data ?? []);
      onDegis?.(data ?? []);
      setYukleniyor(false);
    }
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoranId, supabase]);

  async function ekle() {
    if (!restoranId) return;
    setHata(null);
    const { data, error } = await supabase
      .from("masalar")
      .upsert(
        { restoran_id: restoranId, kapasite: yeniKapasite, adet: yeniAdet, alan: yeniAlan },
        { onConflict: "restoran_id,kapasite,alan" }
      )
      .select()
      .single();

    if (error) {
      setHata("Eklenemedi, tekrar deneyin.");
      return;
    }

    setMasalar((mevcut) => {
      const digerleri = mevcut.filter(
        (m) => !(m.kapasite === data.kapasite && m.alan === data.alan)
      );
      const yeni = [...digerleri, data].sort((a, b) => a.kapasite - b.kapasite);
      onDegis?.(yeni);
      return yeni;
    });
    setYeniKapasite(2);
    setYeniAdet(1);
    setYeniAlan("");
  }

  async function sil(id: string) {
    await supabase.from("masalar").delete().eq("id", id);
    setMasalar((mevcut) => {
      const yeni = mevcut.filter((m) => m.id !== id);
      onDegis?.(yeni);
      return yeni;
    });
  }

  if (!restoranId) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-zinc-50 p-4 text-sm text-muted">
        Masa envanterini ekleyebilmek için önce temel bilgileri bir kere kaydetmen gerekiyor.
      </p>
    );
  }

  if (yukleniyor) return <div className="h-24" />;

  return (
    <div className="space-y-3">
      {masalar.length > 0 ? (
        <div className="space-y-2">
          {masalar.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-sm"
            >
              <span className="font-medium text-foreground">
                {m.adet} masa × {m.kapasite} kişilik
                {m.alan && (
                  <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
                    {MASA_ALANLARI.find((a) => a.deger === m.alan)?.etiket ?? m.alan}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => sil(m.id)}
                className="text-xs font-semibold text-muted hover:text-red-600"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Henüz masa eklemedin. Eklemezsen sistem, gelen tüm rezervasyonları tek bir ortak
          kaynak gibi ele alır (bir rezervasyon o saati herkes için kapatır).
        </p>
      )}

      <div className="flex items-end gap-2 rounded-xl bg-brand-light p-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Kaç kişilik</label>
          <input
            type="number"
            min={1}
            max={50}
            value={yeniKapasite}
            onChange={(e) => setYeniKapasite(Number(e.target.value))}
            className="w-20 rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Kaç masa</label>
          <input
            type="number"
            min={1}
            max={100}
            value={yeniAdet}
            onChange={(e) => setYeniAdet(Number(e.target.value))}
            className="w-20 rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Alan</label>
          <select
            value={yeniAlan}
            onChange={(e) => setYeniAlan(e.target.value)}
            className="rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          >
            {MASA_ALANLARI.map((a) => (
              <option key={a.deger} value={a.deger}>
                {a.etiket}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={ekle}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ekle / Güncelle
        </button>
      </div>
      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}
    </div>
  );
}
