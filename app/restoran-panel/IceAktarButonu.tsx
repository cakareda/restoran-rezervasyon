"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function csvSatirlariniAyristir(metin: string) {
  const satirlar = metin.split(/\r?\n/).filter((s) => s.trim().length > 0);
  return satirlar.map((satir) => {
    const hucreler: string[] = [];
    let mevcut = "";
    let tirnakIcinde = false;
    for (let i = 0; i < satir.length; i++) {
      const karakter = satir[i];
      if (karakter === '"') {
        tirnakIcinde = !tirnakIcinde;
      } else if (karakter === "," && !tirnakIcinde) {
        hucreler.push(mevcut);
        mevcut = "";
      } else {
        mevcut += karakter;
      }
    }
    hucreler.push(mevcut);
    return hucreler.map((h) => h.trim());
  });
}

export default function IceAktarButonu() {
  const router = useRouter();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setSonuc(null);
    setYukleniyor(true);

    const metin = await dosya.text();
    const satirlar = csvSatirlariniAyristir(metin);
    const [baslik, ...veriSatirlari] = satirlar;

    // Beklenen sütunlar: Ad Soyad, Telefon, Tarih (YYYY-MM-DD), Saat (HH:MM), Kişi Sayısı
    const basliginAdSoyadMi = baslik[0]?.toLocaleLowerCase("tr").includes("ad");
    const satirlarKullanilacak = basliginAdSoyadMi ? veriSatirlari : satirlar;

    const gonderilecek = satirlarKullanilacak
      .filter((s) => s.length >= 5 && s[0])
      .map((s) => ({
        adSoyad: s[0],
        telefon: s[1] || null,
        tarihSaat: `${s[2]}T${s[3]}:00`,
        kisiSayisi: Number(s[4]) || 2,
      }));

    if (gonderilecek.length === 0) {
      setSonuc("Geçerli satır bulunamadı. Sütunlar: Ad Soyad, Telefon, Tarih, Saat, Kişi Sayısı");
      setYukleniyor(false);
      if (dosyaRef.current) dosyaRef.current.value = "";
      return;
    }

    const yanit = await fetch("/api/rezervasyon/coklu-ekle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ satirlar: gonderilecek }),
    });
    const govde = await yanit.json().catch(() => ({}));
    setYukleniyor(false);
    if (dosyaRef.current) dosyaRef.current.value = "";

    if (!yanit.ok) {
      setSonuc(govde.hata ?? "Yükleme başarısız oldu.");
      return;
    }
    setSonuc(`${govde.eklenen} rezervasyon eklendi${govde.atlanan ? `, ${govde.atlanan} satır atlandı` : ""}.`);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => dosyaRef.current?.click()}
        disabled={yukleniyor}
        className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-foreground ring-1 ring-border hover:bg-brand-light disabled:opacity-50"
      >
        {yukleniyor ? "Yükleniyor..." : "CSV İçe Aktar"}
      </button>
      <input ref={dosyaRef} type="file" accept=".csv" onChange={dosyaSecildi} className="hidden" />
      {sonuc && (
        <p className="absolute right-0 top-full mt-1 w-64 rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg">
          {sonuc}
        </p>
      )}
    </div>
  );
}
