"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { yerelTarih } from "@/lib/tarih";
import { KisiIkonu, TakvimIkonu, SaatIkonu } from "@/components/icons";

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

function tarihEtiketi(tarihStr: string) {
  const secilen = new Date(`${tarihStr}T00:00:00`);
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const yarin = new Date(bugun);
  yarin.setDate(yarin.getDate() + 1);

  if (secilen.getTime() === bugun.getTime()) return "Bugün";
  if (secilen.getTime() === yarin.getTime()) return "Yarın";
  return secilen.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
}

export default function RezervasyonFormu({
  restoranId,
  acilisSaati,
  kapanisSaati,
}: {
  restoranId: string;
  acilisSaati: string;
  kapanisSaati: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [tarih, setTarih] = useState(() => yerelTarih(new Date()));
  const [saat, setSaat] = useState<string | null>(null);
  const [detayAcik, setDetayAcik] = useState(false);
  const [doluSaatler, setDoluSaatler] = useState<string[]>([]);

  const zamanDilimleri = useMemo(
    () => zamanDilimleriUret(acilisSaati, kapanisSaati),
    [acilisSaati, kapanisSaati]
  );
  const [profil, setProfil] = useState<{ adSoyad: string; eposta: string; telefon: string } | null>(
    null
  );
  const [adSoyad, setAdSoyad] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [notlar, setNotlar] = useState("");

  const bugun = useMemo(() => yerelTarih(new Date()), []);

  useEffect(() => {
    async function doluSaatleriYukle() {
      const yanit = await fetch(
        `/api/restoran/${restoranId}/dolu-saatler?tarih=${tarih}`
      );
      const veri = await yanit.json();
      setDoluSaatler(veri.doluSaatler ?? []);
    }
    doluSaatleriYukle();
  }, [restoranId, tarih]);

  const gosterilecekZamanDilimleri = useMemo(() => {
    let dilimler = zamanDilimleri.filter((dilim) => !doluSaatler.includes(dilim));

    if (tarih === bugun) {
      const simdi = new Date();
      const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
      dilimler = dilimler.filter((dilim) => {
        const [saatStr, dakikaStr] = dilim.split(":");
        return Number(saatStr) * 60 + Number(dakikaStr) > simdiDk;
      });
    }

    return dilimler;
  }, [tarih, bugun, zamanDilimleri, doluSaatler]);

  useEffect(() => {
    async function profiliYukle() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: kullanici } = await supabase
        .from("kullanicilar")
        .select("ad_soyad, eposta, telefon")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (kullanici) {
        setProfil({
          adSoyad: kullanici.ad_soyad,
          eposta: kullanici.eposta,
          telefon: kullanici.telefon ?? "",
        });
        setAdSoyad(kullanici.ad_soyad);
        setEposta(kullanici.eposta);
        setTelefon(kullanici.telefon ?? "");
      }
    }
    profiliYukle();
  }, [supabase]);

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!saat) {
      setHata("Lütfen bir saat seçin.");
      return;
    }
    setHata(null);
    setGonderiliyor(true);

    const yanit = await fetch("/api/rezervasyon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restoranId,
        adSoyad,
        eposta,
        telefon,
        tarihSaat: new Date(`${tarih}T${saat}`).toISOString(),
        kisiSayisi,
        notlar: notlar.trim() || null,
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const gövde = await yanit.json().catch(() => ({}));
      setHata(gövde.hata ?? "Rezervasyon oluşturulamadı, tekrar deneyin.");
      return;
    }

    router.push("/rezervasyon-basarili");
  }

  return (
    <form
      onSubmit={gonder}
      className="h-fit space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-foreground">Rezervasyon talebi oluştur</h2>

      <div className="flex items-center justify-between rounded-xl bg-brand-light px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <KisiIkonu className="h-4 w-4 text-brand" /> Kişi sayısı
        </span>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      <div className="rounded-xl bg-brand-light px-4 py-3">
        <label className="flex items-center justify-between text-sm font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <TakvimIkonu className="h-4 w-4 text-brand" /> {tarihEtiketi(tarih)}
          </span>
          <input
            type="date"
            required
            min={bugun}
            value={tarih}
            onChange={(e) => {
              setTarih(e.target.value);
              setSaat(null);
            }}
            className="rounded-md border-0 bg-white px-2 py-1 text-sm text-brand-dark outline-none ring-1 ring-border"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <SaatIkonu className="h-4 w-4 text-brand" /> Saat seçin
        </p>
        {gosterilecekZamanDilimleri.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {gosterilecekZamanDilimleri.map((dilim) => (
              <button
                key={dilim}
                type="button"
                onClick={() => setSaat(dilim)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  saat === dilim
                    ? "bg-brand text-white"
                    : "bg-brand-light text-brand-dark hover:bg-orange-100"
                }`}
              >
                {dilim}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Bu tarih için uygun saat kalmadı, farklı bir tarih seçin.
          </p>
        )}
      </div>

      {!detayAcik ? (
        <button
          type="button"
          onClick={() => setDetayAcik(true)}
          disabled={!saat}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Devam Et
        </button>
      ) : (
        <div className="space-y-3 border-t border-border pt-4">
          {profil ? (
            <div className="rounded-xl bg-brand-light px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">{profil.adSoyad}</p>
              <p className="text-muted">{profil.eposta}</p>
              {profil.telefon && <p className="text-muted">{profil.telefon}</p>}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Ad Soyad</label>
                <input
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  type="text"
                  required
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">E-posta</label>
                <input
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value)}
                  type="email"
                  required
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  Telefon (opsiyonel)
                </label>
                <input
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  type="tel"
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <p className="text-xs text-muted">
                Misafir olarak devam ediyorsun.{" "}
                <Link href="/hesap/giris" className="font-semibold text-brand hover:underline">
                  Giriş yap
                </Link>{" "}
                ve bilgilerin bir daha yazmana gerek kalmasın.
              </p>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Not (opsiyonel)
            </label>
            <textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              rows={2}
              placeholder="Alerji, özel istek, kutlama vb."
              className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
          </div>

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? "Gönderiliyor..." : "Rezervasyon Talebi Gönder"}
          </button>
        </div>
      )}

      {hata && !detayAcik && <p className="text-sm font-medium text-red-600">{hata}</p>}

      <p className="text-center text-xs text-muted">
        Rezervasyon talebi göndermek ücretsizdir, kartınızdan hiçbir ücret alınmaz.
      </p>
    </form>
  );
}
