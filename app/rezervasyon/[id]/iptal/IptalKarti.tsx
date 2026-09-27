"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function IptalKarti({
  id,
  restoranId,
  degistir,
}: {
  id: string;
  restoranId: string;
  degistir: boolean;
}) {
  const router = useRouter();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [iptalEdildi, setIptalEdildi] = useState(false);

  async function iptalEt() {
    setGonderiliyor(true);
    setHata(null);

    const yanit = await fetch(`/api/rezervasyon/${id}/musteri-iptal`, { method: "POST" });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const gövde = await yanit.json().catch(() => ({}));
      setHata(gövde.hata ?? "İptal edilemedi, tekrar deneyin.");
      return;
    }

    setIptalEdildi(true);

    if (degistir) {
      router.push(`/restoran/${restoranId}`);
    }
  }

  if (iptalEdildi && !degistir) {
    return (
      <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-muted shadow-sm">
        Rezervasyonun iptal edildi. Restorana bildirim gönderildi.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

      {degistir && (
        <p className="text-sm text-muted">
          Önce mevcut rezervasyonun iptal edilecek, ardından yeni bir tarih/saat seçebileceğin
          rezervasyon sayfasına yönlendirileceksin.
        </p>
      )}

      <button
        onClick={iptalEt}
        disabled={gonderiliyor}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {gonderiliyor
          ? "İşleniyor..."
          : degistir
            ? "Rezervasyonu iptal et ve yeni tarih seç"
            : "Rezervasyonu iptal et"}
      </button>

      <Link
        href="/"
        className="block text-center text-sm font-medium text-muted hover:text-brand-dark"
      >
        Vazgeç
      </Link>
    </div>
  );
}
