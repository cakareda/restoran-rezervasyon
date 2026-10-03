"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Deger = {
  uyelikPaketi: string;
  uyelikAylikUcretTl: string;
  hesaplasmaDonemi: string;
  odemeVadesiGun: number;
  odemeYontemi: string;
};

const girdi =
  "w-full rounded-lg border-0 px-2 py-1 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";

export default function Ek1Formu({ restoranId, baslangic }: { restoranId: string; baslangic: Deger }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [d, setD] = useState(baslangic);
  const [durum, setDurum] = useState<"" | "kaydediliyor" | "ok" | "hata">("");

  async function kaydet() {
    setDurum("kaydediliyor");
    const yanit = await fetch(`/api/admin/restoran/${restoranId}/ek1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    setDurum(yanit.ok ? "ok" : "hata");
    if (yanit.ok) router.refresh();
  }

  if (!acik) {
    return (
      <button onClick={() => setAcik(true)} className="text-xs font-semibold text-brand hover:underline">
        Ek-1 alanları{d.uyelikPaketi ? ` · ${d.uyelikPaketi}` : " · üyelik yok"}
      </button>
    );
  }

  return (
    <div className="w-56 space-y-1.5 text-xs">
      <input className={girdi} placeholder="Üyelik paketi" value={d.uyelikPaketi}
        onChange={(e) => setD({ ...d, uyelikPaketi: e.target.value })} />
      <input className={girdi} placeholder="Üyelik ücreti (TL/ay)" inputMode="decimal" value={d.uyelikAylikUcretTl}
        onChange={(e) => setD({ ...d, uyelikAylikUcretTl: e.target.value })} />
      <input className={girdi} placeholder="Hesaplaşma dönemi" value={d.hesaplasmaDonemi}
        onChange={(e) => setD({ ...d, hesaplasmaDonemi: e.target.value })} />
      <input className={girdi} placeholder="Vade (gün)" type="number" min={0} max={90} value={d.odemeVadesiGun}
        onChange={(e) => setD({ ...d, odemeVadesiGun: Number(e.target.value) })} />
      <input className={girdi} placeholder="Ödeme yöntemi" value={d.odemeYontemi}
        onChange={(e) => setD({ ...d, odemeYontemi: e.target.value })} />
      <div className="flex items-center gap-2">
        <button onClick={kaydet} disabled={durum === "kaydediliyor"}
          className="rounded-lg bg-foreground px-3 py-1 font-semibold text-white disabled:opacity-50">
          Kaydet
        </button>
        {durum === "ok" && <span className="text-green-700">Kaydedildi</span>}
        {durum === "hata" && <span className="text-red-600">Hata</span>}
      </div>
      <p className="text-[10px] text-muted">İmzadan önce değiştir; imzalı sözleşme değişmez.</p>
    </div>
  );
}
