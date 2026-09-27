import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { RezervasyonDurum, RezervasyonKaynagi } from "@/lib/types";
import RezervasyonSatiri from "./RezervasyonSatiri";
import BlokEkleFormu from "./BlokEkleFormu";

type RezervasyonSatirVerisi = {
  id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: RezervasyonDurum;
  geldi_mi: boolean | null;
  kaynak: RezervasyonKaynagi;
  kullanicilar: { ad_soyad: string; eposta: string } | null;
};

export default async function RestoranPaneli() {
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

  const { data: rezervasyonlar } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, durum, geldi_mi, kaynak, kullanicilar(ad_soyad, eposta)")
    .eq("restoran_id", restoran.id)
    .order("tarih_saat", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{restoran.ad}</h1>
          <p className="mt-1 text-sm text-muted">Gelen rezervasyon talepleri</p>
        </div>
        <BlokEkleFormu />
      </div>

      <div className="mt-6 space-y-3">
        {rezervasyonlar && rezervasyonlar.length > 0 ? (
          (rezervasyonlar as unknown as RezervasyonSatirVerisi[]).map((r) => (
            <RezervasyonSatiri
              key={r.id}
              id={r.id}
              misafirAd={r.kaynak === "telefon" ? "Telefonla rezervasyon" : r.kullanicilar?.ad_soyad ?? ""}
              misafirEposta={r.kaynak === "telefon" ? "" : r.kullanicilar?.eposta ?? ""}
              tarihSaat={r.tarih_saat}
              kisiSayisi={r.kisi_sayisi}
              durum={r.durum}
              geldiMi={r.geldi_mi}
            />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            Henüz rezervasyon talebi yok.
          </p>
        )}
      </div>
    </div>
  );
}
