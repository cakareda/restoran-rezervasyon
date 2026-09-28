import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { RezervasyonDurum, RezervasyonKaynagi } from "@/lib/types";
import { bugununTarihi, yerelTarih } from "@/lib/tarih";
import RezervasyonSatiri from "./RezervasyonSatiri";
import YeniRezervasyonEkle from "./YeniRezervasyonEkle";
import { AsagiOkIkonu } from "@/components/icons";

type RezervasyonSatirVerisi = {
  id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: RezervasyonDurum;
  geldi_mi: boolean | null;
  kaynak: RezervasyonKaynagi;
  notlar: string | null;
  misafir_ad_soyad: string | null;
  misafir_telefon: string | null;
  misafir_dili: string | null;
  kullanicilar: { ad_soyad: string; eposta: string; telefon: string | null } | null;
};

function tarihEtiketi(tarihStr: string) {
  const secilen = new Date(`${tarihStr}T00:00:00`);
  const bugun = new Date(`${bugununTarihi()}T00:00:00`);
  const yarin = new Date(bugun);
  yarin.setDate(yarin.getDate() + 1);
  const dun = new Date(bugun);
  dun.setDate(dun.getDate() - 1);

  if (secilen.getTime() === bugun.getTime()) return "Bugün";
  if (secilen.getTime() === yarin.getTime()) return "Yarın";
  if (secilen.getTime() === dun.getTime()) return "Dün";
  return secilen.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
}

type Sekme = "bekleyen" | "onayli" | "geldi" | "gelmedi" | "iptal" | "tumu";

const sekmeEtiketi: Record<Sekme, string> = {
  bekleyen: "Bekleyen",
  onayli: "Onaylı",
  geldi: "Geldi",
  gelmedi: "Gelmedi",
  iptal: "İptal",
  tumu: "Tümü",
};

function sekmeyeUyuyorMu(r: RezervasyonSatirVerisi, sekme: Sekme) {
  switch (sekme) {
    case "bekleyen":
      return r.durum === "beklemede";
    case "onayli":
      return r.durum === "onaylandi" && r.geldi_mi === null;
    case "geldi":
      return r.geldi_mi === true;
    case "gelmedi":
      return r.geldi_mi === false;
    case "iptal":
      return r.durum === "reddedildi" || r.durum === "iptal_edildi";
    case "tumu":
      return true;
  }
}

export default async function RestoranPaneli({
  searchParams,
}: {
  searchParams: Promise<{ tarih?: string; sekme?: string; ara?: string }>;
}) {
  const { tarih: tarihParam, sekme: sekmeParam, ara } = await searchParams;
  const tumu = tarihParam === "tumu";
  const tarih = !tumu && tarihParam ? tarihParam : bugununTarihi();
  const sekme: Sekme =
    sekmeParam && sekmeParam in sekmeEtiketi ? (sekmeParam as Sekme) : "bekleyen";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id, ad, acilis_saati, kapanis_saati")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  if (!restoran) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
        Henüz restoran profiliniz oluşturulmamış.{" "}
        <Link href="/restoran-panel/restoranim" className="font-semibold text-brand hover:underline">
          Buradan tamamlayın
        </Link>
        .
      </p>
    );
  }

  let sorgu = supabase
    .from("rezervasyonlar")
    .select(
      "id, tarih_saat, kisi_sayisi, durum, geldi_mi, kaynak, notlar, misafir_ad_soyad, misafir_telefon, misafir_dili, kullanicilar(ad_soyad, eposta, telefon)"
    )
    .eq("restoran_id", restoran.id)
    .order("tarih_saat", { ascending: true });

  if (!tumu) {
    const gunBaslangic = new Date(`${tarih}T00:00:00`);
    const gunBitis = new Date(`${tarih}T00:00:00`);
    gunBitis.setDate(gunBitis.getDate() + 1);
    sorgu = sorgu.gte("tarih_saat", gunBaslangic.toISOString()).lt("tarih_saat", gunBitis.toISOString());
  }

  const { data: rezervasyonlar } = await sorgu;
  const tumListe = (rezervasyonlar ?? []) as unknown as RezervasyonSatirVerisi[];

  const aramaKucuk = (ara ?? "").trim().toLocaleLowerCase("tr");
  const liste = aramaKucuk
    ? tumListe.filter((r) => {
        const ad = (r.kullanicilar?.ad_soyad ?? r.misafir_ad_soyad ?? "").toLocaleLowerCase("tr");
        const tel = r.kullanicilar?.telefon ?? r.misafir_telefon ?? "";
        return ad.includes(aramaKucuk) || tel.includes(aramaKucuk);
      })
    : tumListe;

  const sekmeSayilari: Record<Sekme, number> = {
    bekleyen: liste.filter((r) => sekmeyeUyuyorMu(r, "bekleyen")).length,
    onayli: liste.filter((r) => sekmeyeUyuyorMu(r, "onayli")).length,
    geldi: liste.filter((r) => sekmeyeUyuyorMu(r, "geldi")).length,
    gelmedi: liste.filter((r) => sekmeyeUyuyorMu(r, "gelmedi")).length,
    iptal: liste.filter((r) => sekmeyeUyuyorMu(r, "iptal")).length,
    tumu: liste.length,
  };
  const gosterilecekListe = liste.filter((r) => sekmeyeUyuyorMu(r, sekme));

  const aktifListe = liste.filter((r) => r.durum !== "reddedildi" && r.durum !== "iptal_edildi");
  const toplamKisi = aktifListe.reduce((n, r) => n + r.kisi_sayisi, 0);

  function sekmeUrl(hedefSekme: Sekme) {
    const params = new URLSearchParams();
    if (!tumu) params.set("tarih", tarih);
    else params.set("tarih", "tumu");
    params.set("sekme", hedefSekme);
    if (ara) params.set("ara", ara);
    return `/restoran-panel?${params.toString()}`;
  }

  const oncekiGun = yerelTarih(new Date(new Date(`${tarih}T00:00:00`).getTime() - 86400000));
  const sonrakiGun = yerelTarih(new Date(new Date(`${tarih}T00:00:00`).getTime() + 86400000));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{restoran.ad}</h1>
          <p className="mt-1 text-sm text-muted">Gelen rezervasyon talepleri</p>
        </div>
        <YeniRezervasyonEkle
          restoranId={restoran.id}
          acilisSaati={restoran.acilis_saati.slice(0, 5)}
          kapanisSaati={restoran.kapanis_saati.slice(0, 5)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/restoran-panel?tarih=${oncekiGun}&sekme=${sekme}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-brand-light hover:text-brand-dark"
            aria-label="Önceki gün"
          >
            <AsagiOkIkonu className="h-4 w-4 rotate-90" />
          </Link>
          <div className="min-w-32 text-center">
            <p className="font-bold text-foreground">{tumu ? "Tüm rezervasyonlar" : tarihEtiketi(tarih)}</p>
            {!tumu && <p className="text-xs text-muted">{tarih}</p>}
          </div>
          <Link
            href={`/restoran-panel?tarih=${sonrakiGun}&sekme=${sekme}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-brand-light hover:text-brand-dark"
            aria-label="Sonraki gün"
          >
            <AsagiOkIkonu className="h-4 w-4 -rotate-90" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!tumu && (
            <p className="text-sm font-medium text-foreground">
              {aktifListe.length} rezervasyon · {toplamKisi} kişi
            </p>
          )}
          <Link
            href={
              tumu
                ? `/restoran-panel?tarih=${bugununTarihi()}&sekme=${sekme}`
                : `/restoran-panel?tarih=tumu&sekme=${sekme}`
            }
            className="text-sm font-semibold text-brand hover:underline"
          >
            {tumu ? "Bugüne dön" : "Tümünü gör"}
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(sekmeEtiketi) as Sekme[]).map((s) => (
            <Link
              key={s}
              href={sekmeUrl(s)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                sekme === s
                  ? "bg-brand text-white"
                  : "bg-white text-foreground ring-1 ring-border hover:bg-brand-light"
              }`}
            >
              {sekmeEtiketi[s]}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  sekme === s ? "bg-white/20" : "bg-zinc-100 text-muted"
                }`}
              >
                {sekmeSayilari[s]}
              </span>
            </Link>
          ))}
        </div>
        <form method="get" className="flex items-center">
          {!tumu && <input type="hidden" name="tarih" value={tarih} />}
          {tumu && <input type="hidden" name="tarih" value="tumu" />}
          <input type="hidden" name="sekme" value={sekme} />
          <input
            type="text"
            name="ara"
            defaultValue={ara}
            placeholder="İsim veya telefon ara"
            className="w-56 rounded-full border-0 px-4 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {gosterilecekListe.length > 0 ? (
          gosterilecekListe.map((r) => (
            <RezervasyonSatiri
              key={r.id}
              id={r.id}
              misafirAd={r.kullanicilar?.ad_soyad ?? r.misafir_ad_soyad ?? ""}
              misafirEposta={r.kullanicilar?.eposta ?? ""}
              misafirTelefon={r.kullanicilar?.telefon ?? r.misafir_telefon ?? ""}
              misafirDili={r.misafir_dili}
              kaynak={r.kaynak}
              tarihSaat={r.tarih_saat}
              kisiSayisi={r.kisi_sayisi}
              durum={r.durum}
              geldiMi={r.geldi_mi}
              notlar={r.notlar}
            />
          ))
        ) : liste.length > 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            &quot;{sekmeEtiketi[sekme]}&quot; sekmesinde rezervasyon yok.
          </p>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            {tumu ? "Henüz rezervasyon talebi yok." : "Bu tarihte rezervasyon yok."}
          </p>
        )}
      </div>
    </div>
  );
}
