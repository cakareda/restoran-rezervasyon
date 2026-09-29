"use client";

type Satir = {
  tarihSaat: string;
  misafirAd: string;
  misafirTelefon: string;
  kisiSayisi: number;
  durum: string;
  kaynak: string;
  notlar: string | null;
};

const durumEtiketi: Record<string, string> = {
  beklemede: "Beklemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  iptal_edildi: "Misafir iptal etti",
};

const kaynakEtiketi: Record<string, string> = {
  online: "Online",
  telefon: "Telefon",
};

function csvHucre(deger: string) {
  const guvenli = deger.replace(/"/g, '""');
  return `"${guvenli}"`;
}

// İstanbul saatine göre YYYY-MM-DD / HH:MM üretir — CSV İçe Aktar'ın beklediği
// sütun formatıyla birebir aynı olsun diye (round-trip uyumluluk).
function istanbulTarihSaatBol(tarihSaatIso: string) {
  const istanbul = new Date(new Date(tarihSaatIso).getTime() + 3 * 60 * 60 * 1000);
  const tarih = `${istanbul.getUTCFullYear()}-${String(istanbul.getUTCMonth() + 1).padStart(2, "0")}-${String(istanbul.getUTCDate()).padStart(2, "0")}`;
  const saat = `${String(istanbul.getUTCHours()).padStart(2, "0")}:${String(istanbul.getUTCMinutes()).padStart(2, "0")}`;
  return { tarih, saat };
}

export default function DisaAktarButonu({ satirlar }: { satirlar: Satir[] }) {
  function disaAktar() {
    const basliklar = [
      "Ad Soyad",
      "Telefon",
      "Tarih",
      "Saat",
      "Kişi Sayısı",
      "Durum",
      "Kaynak",
      "Not",
    ];
    const satirMetinleri = satirlar.map((s) => {
      const { tarih, saat } = istanbulTarihSaatBol(s.tarihSaat);
      return [
        csvHucre(s.misafirAd),
        csvHucre(s.misafirTelefon),
        csvHucre(tarih),
        csvHucre(saat),
        csvHucre(String(s.kisiSayisi)),
        csvHucre(durumEtiketi[s.durum] ?? s.durum),
        csvHucre(kaynakEtiketi[s.kaynak] ?? s.kaynak),
        csvHucre(s.notlar ?? ""),
      ].join(",");
    });
    const csv = "﻿" + [basliklar.join(","), ...satirMetinleri].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rezervasyonlar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={disaAktar}
      disabled={satirlar.length === 0}
      className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-foreground ring-1 ring-border hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      CSV Dışa Aktar
    </button>
  );
}
