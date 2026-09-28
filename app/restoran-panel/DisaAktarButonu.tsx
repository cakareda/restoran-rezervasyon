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

function csvHucre(deger: string) {
  const guvenli = deger.replace(/"/g, '""');
  return `"${guvenli}"`;
}

export default function DisaAktarButonu({ satirlar }: { satirlar: Satir[] }) {
  function disaAktar() {
    const basliklar = ["Tarih/Saat", "Misafir", "Telefon", "Kişi Sayısı", "Durum", "Kaynak", "Not"];
    const satirMetinleri = satirlar.map((s) =>
      [
        csvHucre(new Date(s.tarihSaat).toLocaleString("tr-TR")),
        csvHucre(s.misafirAd),
        csvHucre(s.misafirTelefon),
        csvHucre(String(s.kisiSayisi)),
        csvHucre(s.durum),
        csvHucre(s.kaynak),
        csvHucre(s.notlar ?? ""),
      ].join(",")
    );
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
