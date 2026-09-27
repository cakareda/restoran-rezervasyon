import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { RezervasyonDurum, RezervasyonKaynagi } from "@/lib/types";
import { bugununTarihi, yerelTarih } from "@/lib/tarih";
import RezervasyonSatiri from "./RezervasyonSatiri";
import BlokEkleFormu from "./BlokEkleFormu";
import { AsagiOkIkonu } from "@/components/icons";

type RezervasyonSatirVerisi = {
  id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: RezervasyonDurum;
  geldi_mi: boolean | null;
  kaynak: RezervasyonKaynagi;
  notlar: string | null;
  kullanicilar: { ad_soyad: string; eposta: string } | null;
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

export default async function RestoranPaneli({
  searchParams,
}: {
  searchParams: Promise<{ tarih?: string }>;
}) {
  const { tarih: tarihParam } = await searchParams;
  const tumu = tarihParam === "tumu";
  const tarih = !tumu && tarihParam ? tarihParam : bugununTarihi();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id, ad")
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
    .select("id, tarih_saat, kisi_sayisi, durum, geldi_mi, kaynak, notlar, kullanicilar(ad_soyad, eposta)")
    .eq("restoran_id", restoran.id)
    .order("tarih_saat", { ascending: true });

  if (!tumu) {
    const gunBaslangic = new Date(`${tarih}T00:00:00`);
    const gunBitis = new Date(`${tarih}T00:00:00`);
    gunBitis.setDate(gunBitis.getDate() + 1);
    sorgu = sorgu.gte("tarih_saat", gunBaslangic.toISOString()).lt("tarih_saat", gunBitis.toISOString());
  }

  const { data: rezervasyonlar } = await sorgu;
  const liste = (rezervasyonlar ?? []) as unknown as RezervasyonSatirVerisi[];

  const aktifListe = liste.filter((r) => r.durum !== "reddedildi" && r.durum !== "iptal_edildi");
  const toplamKisi = aktifListe.reduce((n, r) => n + r.kisi_sayisi, 0);

  const oncekiGun = yerelTarih(new Date(new Date(`${tarih}T00:00:00`).getTime() - 86400000));
  const sonrakiGun = yerelTarih(new Date(new Date(`${tarih}T00:00:00`).getTime() + 86400000));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{restoran.ad}</h1>
          <p className="mt-1 text-sm text-muted">Gelen rezervasyon talepleri</p>
        </div>
        <BlokEkleFormu />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/restoran-panel?tarih=${oncekiGun}`}
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
            href={`/restoran-panel?tarih=${sonrakiGun}`}
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
            href={tumu ? `/restoran-panel?tarih=${bugununTarihi()}` : "/restoran-panel?tarih=tumu"}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {tumu ? "Bugüne dön" : "Tümünü gör"}
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {liste.length > 0 ? (
          liste.map((r) => (
            <RezervasyonSatiri
              key={r.id}
              id={r.id}
              misafirAd={r.kaynak === "telefon" ? "Telefonla rezervasyon" : r.kullanicilar?.ad_soyad ?? ""}
              misafirEposta={r.kaynak === "telefon" ? "" : r.kullanicilar?.eposta ?? ""}
              tarihSaat={r.tarih_saat}
              kisiSayisi={r.kisi_sayisi}
              durum={r.durum}
              geldiMi={r.geldi_mi}
              notlar={r.notlar}
            />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            {tumu ? "Henüz rezervasyon talebi yok." : "Bu tarihte rezervasyon yok."}
          </p>
        )}
      </div>
    </div>
  );
}
