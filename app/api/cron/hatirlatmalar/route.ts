import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { hatirlatmaEpostasi } from "@/lib/email/templates";

// Rezervasyon saatinden ~3 saat önceki 15 dakikalık pencereye giren, henüz
// hatırlatması gitmemiş onaylı rezervasyonları bulup e-posta gönderir.
// Vercel Cron her 15 dakikada bir bu route'u çağırır (bkz. vercel.json).
const HATIRLATMA_ONCESI_DK = 180;
const PENCERE_DK = 15;

export async function GET(request: Request) {
  const yetkiBasligi = request.headers.get("authorization");
  if (process.env.CRON_SECRET && yetkiBasligi !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const simdi = Date.now();
  const pencereBaslangic = new Date(simdi + (HATIRLATMA_ONCESI_DK - PENCERE_DK) * 60000);
  const pencereBitis = new Date(simdi + HATIRLATMA_ONCESI_DK * 60000);

  const { data: rezervasyonlar, error } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, restoran_id, kullanici_id, kullanicilar(eposta)")
    .eq("durum", "onaylandi")
    .eq("hatirlatma_gonderildi", false)
    .not("kullanici_id", "is", null)
    .gte("tarih_saat", pencereBaslangic.toISOString())
    .lt("tarih_saat", pencereBitis.toISOString());

  if (error) {
    return NextResponse.json({ hata: "Sorgu başarısız." }, { status: 500 });
  }

  let gonderilen = 0;

  for (const r of rezervasyonlar ?? []) {
    const kullanici = r.kullanicilar as unknown as { eposta: string } | null;
    if (!kullanici?.eposta) continue;

    const { data: restoran } = await supabase
      .from("restoranlar")
      .select("ad")
      .eq("id", r.restoran_id)
      .single();
    if (!restoran) continue;

    const { konu, html } = hatirlatmaEpostasi({
      restoranAd: restoran.ad,
      tarihSaat: r.tarih_saat,
      kisiSayisi: r.kisi_sayisi,
      iptalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/rezervasyon/${r.id}/iptal`,
    });

    await bildirimGonderVeKaydet({
      rezervasyonId: r.id,
      aliciEposta: kullanici.eposta,
      tur: "hatirlatma",
      konu,
      html,
    });

    await supabase.from("rezervasyonlar").update({ hatirlatma_gonderildi: true }).eq("id", r.id);
    gonderilen++;
  }

  return NextResponse.json({ gonderilen });
}
