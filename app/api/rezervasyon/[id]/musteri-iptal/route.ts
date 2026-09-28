import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { musteriIptalEpostasi, misafirIptalOnayEpostasi } from "@/lib/email/templates";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, durum, restoran_id, kullanicilar(ad_soyad, eposta)")
    .eq("id", id)
    .single();

  if (!rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon bulunamadı." }, { status: 404 });
  }

  if (rezervasyon.durum === "iptal_edildi" || rezervasyon.durum === "reddedildi") {
    return NextResponse.json({ hata: "Bu rezervasyon zaten aktif değil." }, { status: 400 });
  }

  if (new Date(rezervasyon.tarih_saat) < new Date()) {
    return NextResponse.json({ hata: "Geçmiş bir rezervasyon iptal edilemez." }, { status: 400 });
  }

  const { error } = await supabase
    .from("rezervasyonlar")
    .update({ durum: "iptal_edildi" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ hata: "İptal edilemedi." }, { status: 500 });
  }

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("ad, eposta")
    .eq("id", rezervasyon.restoran_id)
    .single();

  const misafir = Array.isArray(rezervasyon.kullanicilar)
    ? rezervasyon.kullanicilar[0]
    : rezervasyon.kullanicilar;

  if (restoran) {
    const { konu, html } = musteriIptalEpostasi({
      misafirAd: misafir?.ad_soyad ?? "Misafir",
      tarihSaat: rezervasyon.tarih_saat,
      kisiSayisi: rezervasyon.kisi_sayisi,
    });
    await bildirimGonderVeKaydet({
      rezervasyonId: rezervasyon.id,
      aliciEposta: restoran.eposta,
      tur: "musteri_iptali",
      konu,
      html,
    });
  }

  if (restoran && misafir?.eposta) {
    const { konu, html } = misafirIptalOnayEpostasi({
      restoranAd: restoran.ad,
      tarihSaat: rezervasyon.tarih_saat,
      kisiSayisi: rezervasyon.kisi_sayisi,
    });
    await bildirimGonderVeKaydet({
      rezervasyonId: rezervasyon.id,
      aliciEposta: misafir.eposta,
      tur: "musteri_iptali",
      konu,
      html,
    });
  }

  return NextResponse.json({ basari: true });
}
