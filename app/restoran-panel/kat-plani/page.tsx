import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { RestoranMasasi } from "@/lib/types";
import { bugununTarihi } from "@/lib/tarih";
import KatPlaniClient from "./KatPlaniClient";

export const metadata: Metadata = { title: "Kat Planı" };

export type BugunkuAtama = {
  masaId: string;
  rezervasyonId: string;
  misafirAd: string;
  tarihSaat: string;
  kisiSayisi: number;
};

export default async function KatPlani() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id, oturma_suresi_dk")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  if (!restoran) {
    return <p className="text-muted">Önce restoran profilinizi tamamlayın.</p>;
  }

  const { data: masalar } = await supabase
    .from("restoran_masalari")
    .select("*")
    .eq("restoran_id", restoran.id)
    .order("olusturulma", { ascending: true });

  const bugun = bugununTarihi();
  const { data: bugunkuRezervasyonlar } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, atanan_masa_idler, misafir_ad_soyad, kullanicilar(ad_soyad)")
    .eq("restoran_id", restoran.id)
    .eq("durum", "onaylandi")
    .not("atanan_masa_idler", "is", null)
    .gte("tarih_saat", `${bugun}T00:00:00+03:00`)
    .lt("tarih_saat", `${bugun}T23:59:59+03:00`);

  const atamalar: BugunkuAtama[] = [];
  for (const r of bugunkuRezervasyonlar ?? []) {
    const misafirAd =
      (r.kullanicilar as unknown as { ad_soyad: string } | null)?.ad_soyad ?? r.misafir_ad_soyad ?? "";
    for (const masaId of (r.atanan_masa_idler as string[] | null) ?? []) {
      atamalar.push({
        masaId,
        rezervasyonId: r.id,
        misafirAd,
        tarihSaat: r.tarih_saat,
        kisiSayisi: r.kisi_sayisi,
      });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Kat Planı</h1>
      <p className="mt-1 text-sm text-muted">
        Masalarını sürükleyerek yerleştir, isim/kapasite/alan düzenle. Bugünün atamaları her masanın
        altında görünür — rezervasyon listesinden &quot;Masa ata&quot; ile birden fazla masayı
        birleştirebilirsin.
      </p>

      <KatPlaniClient
        restoranId={restoran.id}
        masalar={(masalar ?? []) as RestoranMasasi[]}
        bugunkuAtamalar={atamalar}
        oturmaSuresiDk={restoran.oturma_suresi_dk ?? 90}
      />
    </div>
  );
}
