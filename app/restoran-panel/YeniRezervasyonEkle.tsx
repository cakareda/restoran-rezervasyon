"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bugununTarihi, istanbulTarihSaat } from "@/lib/tarih";
import { KapatIkonu, KisiIkonu, TakvimIkonu } from "@/components/icons";

function zamanDilimleriUret(acilisSaati: string, kapanisSaati: string) {
  const [acilisSaat, acilisDakika] = acilisSaati.split(":").map(Number);
  const [kapanisSaat, kapanisDakika] = kapanisSaati.split(":").map(Number);
  const baslangicDk = acilisSaat * 60 + acilisDakika;
  const bitisDk = kapanisSaat * 60 + kapanisDakika;

  const dilimler: string[] = [];
  for (let dk = baslangicDk; dk <= bitisDk; dk += 30) {
    const saat = String(Math.floor(dk / 60)).padStart(2, "0");
    const dakika = String(dk % 60).padStart(2, "0");
    dilimler.push(`${saat}:${dakika}`);
  }
  return dilimler;
}

export default function YeniRezervasyonEkle({
  restoranId,
  acilisSaati,
  kapanisSaati,
}: {
  restoranId: string;
  acilisSaati: string;
  kapanisSaati: string;
}) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [adSoyad, setAdSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [tarih, setTarih] = useState(bugununTarihi());
  const [saat, setSaat] = useState<string | null>(null);
  const [doluSaatler, setDoluSaatler] = useState<string[]>([]);

  const zamanDilimleri = useMemo(
    () => zamanDilimleriUret(acilisSaati, kapanisSaati),
    [acilisSaati, kapanisSaati]
  );

  useEffect(() => {
    if (!acik) return;
    async function yukle() {
      const yanit = await fetch(
        `/api/restoran/${restoranId}/dolu-saatler?tarih=${tarih}&kisiSayisi=${kisiSayisi}`
      );
      const veri = await yanit.json();
      setDoluSaatler(veri.doluSaatler ?? []);
    }
    yukle();
  }, [acik, restoranId, tarih, kisiSayisi]);

  function kapat() {
    setAcik(false);
    setAdSoyad("");
    setTelefon("");
    setKisiSayisi(2);
    setSaat(null);
    setHata(null);
  }

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!saat) {
      setHata("Bir saat seçin.");
      return;
    }
    setHata(null);
    setGonderiliyor(true);

    const yanit = await fetch("/api/rezervasyon/blokla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adSoyad,
        telefon: telefon || null,
        tarihSaat: istanbulTarihSaat(tarih, saat).toISOString(),
        kisiSayisi,
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const govde = await yanit.json().catch(() => ({}));
      setHata(govde.hata ?? "Rezervasyon eklenemedi.");
      return;
    }

    kapat();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setAcik(true)}
        className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        + Rezervasyon Ekle
      </button>

      {acik && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={kapat}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Yeni Rezervasyon Ekle</h2>
                <p className="mt-1 text-sm text-muted">
                  Telefon, walk-in veya e-posta ile gelen talepleri buradan kaydedin.
                </p>
              </div>
              <button
                onClick={kapat}
                aria-label="Kapat"
                className="text-muted hover:text-foreground"
              >
                <KapatIkonu className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={gonder} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground">Ad Soyad</label>
                <input
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  required
                  placeholder="Misafirin adı soyadı"
                  className="mt-1 w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground">Telefon</label>
                <input
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  className="mt-1 w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground">Kişi sayısı</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl bg-brand-light px-4 py-2.5">
                  <KisiIkonu className="h-4 w-4 text-brand" />
                  <button
                    type="button"
                    onClick={() => setKisiSayisi((n) => Math.max(1, n - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-dark shadow-sm hover:bg-brand hover:text-white"
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-bold text-foreground">{kisiSayisi}</span>
                  <button
                    type="button"
                    onClick={() => setKisiSayisi((n) => Math.min(20, n + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-dark shadow-sm hover:bg-brand hover:text-white"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted">kişi</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground">Tarih</label>
                <div className="relative mt-1">
                  <TakvimIkonu className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    value={tarih}
                    min={bugununTarihi()}
                    onChange={(e) => {
                      setTarih(e.target.value);
                      setSaat(null);
                    }}
                    className="w-full rounded-xl border-0 py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground">Saat</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {zamanDilimleri.map((dilim) => {
                    const dolu = doluSaatler.includes(dilim);
                    return (
                      <button
                        key={dilim}
                        type="button"
                        disabled={dolu}
                        onClick={() => setSaat(dilim)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          dolu
                            ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                            : saat === dilim
                              ? "bg-brand text-white"
                              : "bg-brand-light text-brand-dark hover:bg-orange-100"
                        }`}
                      >
                        {dilim}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

              <button
                type="submit"
                disabled={gonderiliyor}
                className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                {gonderiliyor ? "Ekleniyor..." : "Rezervasyon Ekle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
