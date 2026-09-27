import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { yeniTalepEpostasi } from "@/lib/email/templates";

export async function POST(request: Request) {
  const body = await request.json();
  const { restoranId, adSoyad, eposta, telefon, tarihSaat, kisiSayisi, notlar } = body;

  if (!restoranId || !adSoyad || !eposta || !tarihSaat || !kisiSayisi) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: restoran, error: restoranHata } = await supabase
    .from("restoranlar")
    .select("id, ad, eposta")
    .eq("id", restoranId)
    .single();

  if (restoranHata || !restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  const { data: kullanici, error: kullaniciHata } = await supabase
    .from("kullanicilar")
    .upsert(
      { ad_soyad: adSoyad, eposta, telefon: telefon ?? null },
      { onConflict: "eposta" }
    )
    .select("id")
    .single();

  if (kullaniciHata || !kullanici) {
    return NextResponse.json({ hata: "Kullanıcı kaydedilemedi." }, { status: 500 });
  }

  const { data: rezervasyon, error: rezervasyonHata } = await supabase
    .from("rezervasyonlar")
    .insert({
      restoran_id: restoranId,
      kullanici_id: kullanici.id,
      tarih_saat: tarihSaat,
      kisi_sayisi: kisiSayisi,
      durum: "beklemede",
      notlar: notlar ?? null,
    })
    .select("id")
    .single();

  if (rezervasyonHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon oluşturulamadı." }, { status: 500 });
  }

  const { konu, html } = yeniTalepEpostasi({
    restoranAd: restoran.ad,
    misafirAd: adSoyad,
    tarihSaat,
    kisiSayisi,
    panelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/restoran-panel`,
  });

  await bildirimGonderVeKaydet({
    rezervasyonId: rezervasyon.id,
    aliciEposta: restoran.eposta,
    tur: "yeni_talep",
    konu,
    html,
  });

  return NextResponse.json({ rezervasyonId: rezervasyon.id });
}
