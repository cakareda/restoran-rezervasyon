"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bugununTarihi } from "@/lib/tarih";

export default function BlokEkleFormu() {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);

    const form = new FormData(e.currentTarget);
    const tarih = form.get("tarih");
    const saat = form.get("saat");

    const yanit = await fetch("/api/rezervasyon/blokla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tarihSaat: new Date(`${tarih}T${saat}`).toISOString(),
        kisiSayisi: Number(form.get("kisiSayisi") || 1),
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      setHata("Saat bloklanamadı, tekrar deneyin.");
      return;
    }

    setAcik(false);
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-brand-light"
      >
        Telefonla gelen rezervasyon için saat blokla
      </button>
    );
  }

  return (
    <form
      onSubmit={gonder}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-white p-3"
    >
      <div>
        <label className="block text-xs font-semibold text-muted">Tarih</label>
        <input
          name="tarih"
          type="date"
          required
          defaultValue={bugununTarihi()}
          className="rounded-md border-0 px-2 py-1.5 text-sm ring-1 ring-border"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted">Saat</label>
        <input
          name="saat"
          type="time"
          required
          className="rounded-md border-0 px-2 py-1.5 text-sm ring-1 ring-border"
        />
      </div>
      <div className="w-20">
        <label className="block text-xs font-semibold text-muted">Kişi</label>
        <input
          name="kisiSayisi"
          type="number"
          min={1}
          defaultValue={2}
          className="w-full rounded-md border-0 px-2 py-1.5 text-sm ring-1 ring-border"
        />
      </div>
      <button
        type="submit"
        disabled={gonderiliyor}
        className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {gonderiliyor ? "Ekleniyor..." : "Blokla"}
      </button>
      <button
        type="button"
        onClick={() => setAcik(false)}
        className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
      >
        Vazgeç
      </button>
      {hata && <p className="w-full text-sm font-medium text-red-600">{hata}</p>}
    </form>
  );
}
