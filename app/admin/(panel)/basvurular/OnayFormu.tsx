"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIYAT_ARALIKLARI } from "@/lib/types";

export default function OnayFormu({
  basvuruId,
  restoranAdi,
}: {
  basvuruId: string;
  restoranAdi: string;
}) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [sehir, setSehir] = useState("");
  const [semt, setSemt] = useState("");
  const [mutfakTuru, setMutfakTuru] = useState("");
  const [fiyatSeviyesi, setFiyatSeviyesi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ girisLinki: string } | null>(null);

  async function onayla(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setHata(null);

    const yanit = await fetch(`/api/admin/basvuru/${basvuruId}/onayla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sehir, semt, mutfakTuru, fiyatSeviyesi: Number(fiyatSeviyesi) }),
    });
    const gövde = await yanit.json();
    setGonderiliyor(false);

    if (!yanit.ok) {
      setHata(gövde.hata ?? "Bir şeyler ters gitti.");
      return;
    }
    setSonuc({ girisLinki: gövde.girisLinki });
  }

  if (sonuc) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
        <p className="font-semibold text-green-800">
          ✅ {restoranAdi} eklendi. Bu linki restorana WhatsApp/e-posta ile ilet:
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={sonuc.girisLinki}
            onClick={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs outline-none ring-1 ring-border"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sonuc.girisLinki);
            }}
            className="shrink-0 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Kopyala
          </button>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-2 text-xs font-semibold text-green-800 hover:underline"
        >
          Listeyi yenile
        </button>
      </div>
    );
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
      >
        Onayla ve restoran oluştur
      </button>
    );
  }

  return (
    <form onSubmit={onayla} className="mt-3 space-y-2 rounded-xl border border-border bg-zinc-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={sehir}
          onChange={(e) => setSehir(e.target.value)}
          placeholder="Şehir"
          required
          className="rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
        />
        <input
          value={semt}
          onChange={(e) => setSemt(e.target.value)}
          placeholder="Semt"
          required
          className="rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
        />
      </div>
      <input
        value={mutfakTuru}
        onChange={(e) => setMutfakTuru(e.target.value)}
        placeholder="Mutfak türü (örn. Türk, Kebap, İtalyan)"
        required
        className="w-full rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
      />
      <select
        value={fiyatSeviyesi}
        onChange={(e) => setFiyatSeviyesi(e.target.value)}
        required
        className="w-full rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
      >
        <option value="" disabled>
          Fiyat seviyesi seç
        </option>
        {FIYAT_ARALIKLARI.map((f) => (
          <option key={f.seviye} value={f.seviye}>
            {f.etiket}
          </option>
        ))}
      </select>

      {hata && <p className="text-xs font-medium text-red-600">{hata}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={gonderiliyor}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {gonderiliyor ? "Oluşturuluyor..." : "Oluştur"}
        </button>
        <button
          type="button"
          onClick={() => setAcik(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-zinc-100"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
