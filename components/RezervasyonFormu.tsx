"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { yerelTarih, istanbulTarihSaat } from "@/lib/tarih";
import { OZEL_GUN_SECENEKLERI } from "@/lib/types";
import { KisiIkonu, TakvimIkonu, SaatIkonu } from "@/components/icons";
import TelefonGirdisi from "@/components/TelefonGirdisi";
import { gununSaatleri } from "@/lib/calismaSaatleri";

function zamanDilimleriUret(acilisSaati: string, kapanisSaati: string) {
  const [acilisSaat, acilisDakika] = acilisSaati.split(":").map(Number);
  const [kapanisSaat, kapanisDakika] = kapanisSaati.split(":").map(Number);
  const baslangicDk = acilisSaat * 60 + acilisDakika;
  const bitisDk = kapanisSaat * 60 + kapanisDakika;

  const dilimler: string[] = [];
  for (let dk = baslangicDk; dk < bitisDk; dk += 30) {
    const saat = String(Math.floor(dk / 60)).padStart(2, "0");
    const dakika = String(dk % 60).padStart(2, "0");
    dilimler.push(`${saat}:${dakika}`);
  }
  return dilimler;
}

export default function RezervasyonFormu({
  restoranId,
  acilisSaati,
  kapanisSaati,
  calismaSaatleriJson,
  maksimumKisi = 20,
  enErkenSaat = 1,
  enGecGun = 60,
}: {
  restoranId: string;
  acilisSaati: string;
  kapanisSaati: string;
  calismaSaatleriJson?: string | null;
  maksimumKisi?: number;
  enErkenSaat?: number;
  enGecGun?: number;
}) {
  const t = useTranslations("RezervasyonFormu");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [tarih, setTarih] = useState(() => yerelTarih(new Date()));
  const [saat, setSaat] = useState<string | null>(null);
  const [detayAcik, setDetayAcik] = useState(false);
  const [doluSaatler, setDoluSaatler] = useState<string[]>([]);

  function tarihEtiketi(tarihStr: string) {
    const bugunStr = yerelTarih(new Date());
    const yarinStr = yerelTarih(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));

    if (tarihStr === bugunStr) return t("tarihBugun");
    if (tarihStr === yarinStr) return t("tarihYarin");

    const secilen = new Date(`${tarihStr}T00:00:00Z`);
    return secilen.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      weekday: "long",
      timeZone: "Europe/Istanbul",
    });
  }

  const gununSaati = useMemo(
    () =>
      gununSaatleri({
        tarih,
        calismaSaatleriJson,
        varsayilanAcilis: acilisSaati,
        varsayilanKapanis: kapanisSaati,
      }),
    [tarih, calismaSaatleriJson, acilisSaati, kapanisSaati]
  );

  const zamanDilimleri = useMemo(
    () =>
      gununSaati.kapali ? [] : zamanDilimleriUret(gununSaati.acilis, gununSaati.kapanis),
    [gununSaati]
  );
  const [profil, setProfil] = useState<{ adSoyad: string; eposta: string; telefon: string } | null>(
    null
  );
  const [adSoyad, setAdSoyad] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [notlar, setNotlar] = useState("");
  const [ozelGun, setOzelGun] = useState("");
  const [beklemeEklendi, setBeklemeEklendi] = useState(false);
  const [beklemeGonderiliyor, setBeklemeGonderiliyor] = useState(false);

  const bugun = useMemo(() => yerelTarih(new Date()), []);
  const enGecTarih = useMemo(
    () => yerelTarih(new Date(new Date().getTime() + enGecGun * 24 * 60 * 60 * 1000)),
    [enGecGun]
  );

  useEffect(() => {
    async function doluSaatleriYukle() {
      setBeklemeEklendi(false);
      const yanit = await fetch(
        `/api/restoran/${restoranId}/dolu-saatler?tarih=${tarih}&kisiSayisi=${kisiSayisi}`
      );
      const veri = await yanit.json();
      setDoluSaatler(veri.doluSaatler ?? []);
    }
    doluSaatleriYukle();
  }, [restoranId, tarih, kisiSayisi]);

  async function beklemeListesineEkle() {
    setBeklemeGonderiliyor(true);
    const yanit = await fetch("/api/rezervasyon/bekleme-listesi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restoranId,
        adSoyad: adSoyad || profil?.adSoyad,
        eposta: eposta || profil?.eposta,
        telefon: telefon || profil?.telefon,
        tarih,
        saat: "20:00",
        kisiSayisi,
      }),
    });
    setBeklemeGonderiliyor(false);
    if (yanit.ok) setBeklemeEklendi(true);
  }

  const gosterilecekZamanDilimleri = useMemo(() => {
    const dilimler = zamanDilimleri.filter((dilim) => !doluSaatler.includes(dilim));

    // İstanbul UTC+3 sabit; sunucu (genelde UTC) ile tarayıcı farklı "şimdi"
    // hesaplamasın diye runtime'ın local saatine değil İstanbul saatine göre
    // filtreliyoruz (aksi halde SSR/hydration'da farklı buton listesi çıkar).
    // Aynı zamanda restoranın "en erken X saat öncesinden" kuralını da burada
    // uyguluyoruz ki sunucunun zaten reddedeceği bir saat arayüzde tıklanabilir
    // görünmesin.
    const enErkenMs = new Date().getTime() + enErkenSaat * 60 * 60 * 1000;
    return dilimler.filter((dilim) => {
      const zaman = istanbulTarihSaat(tarih, dilim);
      return zaman.getTime() >= enErkenMs;
    });
  }, [tarih, zamanDilimleri, doluSaatler, enErkenSaat]);

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
      setHata(t("hataSaatSec"));
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
        tarihSaat: istanbulTarihSaat(tarih, saat).toISOString(),
        kisiSayisi,
        notlar: notlar.trim() || null,
        ozelGun: ozelGun || null,
        misafirDili: locale,
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const gövde = await yanit.json().catch(() => ({}));
      setHata(gövde.hata ?? t("hataGenel"));
      return;
    }

    router.push("/rezervasyon-basarili");
  }

  return (
    <form
      method="post"
      onSubmit={gonder}
      className="h-fit space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-foreground">{t("baslik")}</h2>

      <div className="flex items-center justify-between rounded-xl bg-brand-light px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <KisiIkonu className="h-4 w-4 text-brand" /> {t("kisiSayisiEtiket")}
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
            disabled={kisiSayisi >= maksimumKisi}
            onClick={() => setKisiSayisi((n) => Math.min(maksimumKisi, n + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-dark shadow-sm hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      {kisiSayisi >= maksimumKisi && (
        <p className="-mt-3 text-xs text-muted">
          {maksimumKisi} üzeri kalabalık gruplar için lütfen restoranı doğrudan arayın.
        </p>
      )}

      <div className="rounded-xl bg-brand-light px-4 py-3">
        <label className="flex items-center justify-between text-sm font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <TakvimIkonu className="h-4 w-4 text-brand" /> {tarihEtiketi(tarih)}
          </span>
          <input
            type="date"
            required
            min={bugun}
            max={enGecTarih}
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
          <SaatIkonu className="h-4 w-4 text-brand" /> {t("saatSeciBaslik")}
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
          <div className="space-y-3 rounded-xl bg-amber-50 p-3">
            <p className="text-sm text-amber-800">{t("uygunSaatYok")}</p>
            {beklemeEklendi ? (
              <p className="text-sm font-medium text-green-700">{t("beklemeEklendiMesaj")}</p>
            ) : profil ? (
              <button
                type="button"
                onClick={beklemeListesineEkle}
                disabled={beklemeGonderiliyor}
                className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {beklemeGonderiliyor ? t("gonderiliyor") : t("beklemeListesineEkle")}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  type="text"
                  name="adSoyad"
                  autoComplete="name"
                  aria-label={t("adSoyadEtiket")}
                  placeholder={t("adSoyadEtiket")}
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
                <input
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value)}
                  type="email"
                  name="eposta"
                  autoComplete="email"
                  aria-label={t("epostaEtiket")}
                  placeholder={t("epostaEtiket")}
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={beklemeListesineEkle}
                  disabled={beklemeGonderiliyor || !adSoyad || !eposta}
                  className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {beklemeGonderiliyor ? t("gonderiliyor") : t("beklemeListesineEkle")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!detayAcik ? (
        <button
          type="button"
          onClick={() => setDetayAcik(true)}
          disabled={!saat}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("devamEt")}
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
                <label className="block text-sm font-medium text-foreground">
                  {t("adSoyadEtiket")}
                </label>
                <input
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  type="text"
                  name="adSoyad"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t("epostaEtiket")}
                </label>
                <input
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value)}
                  type="email"
                  name="eposta"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t("telefonEtiket")}
                </label>
                <TelefonGirdisi
                  value={telefon}
                  onChange={setTelefon}
                  girdiSinifi="rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
                />
              </div>
              <p className="text-xs text-muted">
                {t("misafirNotu")}{" "}
                <Link href="/hesap/giris" className="font-semibold text-brand hover:underline">
                  {t("girisYapLink")}
                </Link>{" "}
                {t("girisYapSonu")}
              </p>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">{t("ozelGunEtiket")}</label>
            <select
              value={ozelGun}
              onChange={(e) => setOzelGun(e.target.value)}
              className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            >
              <option value="">{t("ozelGunYok")}</option>
              {OZEL_GUN_SECENEKLERI.map((o) => (
                <option key={o.deger} value={o.deger}>
                  {t(`ozelGun.${o.deger}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">{t("notEtiket")}</label>
            <textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t("notPlaceholder")}
              className="w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
          </div>

          {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {gonderiliyor ? t("gonderiliyor") : t("gonderBtn")}
          </button>
        </div>
      )}

      {hata && !detayAcik && <p className="text-sm font-medium text-red-600">{hata}</p>}

      <p className="text-center text-xs text-muted">{t("ucretsizNot")}</p>
    </form>
  );
}
