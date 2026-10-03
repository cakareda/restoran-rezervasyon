import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { restoranIptalEpostasi } from "@/lib/email/templates";
import { teyitLinkUret, teyitKisaKod } from "@/lib/misafirTeyit";
import { whatsappSablonGonder, whatsappSablonDili, whatsappTarihMetni } from "@/lib/whatsapp";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { data: restoranSahiplik } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!restoranSahiplik) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const { data: rezervasyon, error: guncelHata } = await supabase
    .from("rezervasyonlar")
    .update({ durum: "iptal_edildi", iptal_eden: "restoran" })
    .eq("id", id)
    .eq("restoran_id", restoranSahiplik.id)
    .select("id, tarih_saat, kisi_sayisi, kullanici_id, restoran_id, misafir_dili")
    .single();

  if (guncelHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon güncellenemedi." }, { status: 404 });
  }

  const [{ data: kullanici }, { data: restoran }] = await Promise.all([
    rezervasyon.kullanici_id
      ? supabase.from("kullanicilar").select("eposta, telefon").eq("id", rezervasyon.kullanici_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("restoranlar").select("ad").eq("id", rezervasyon.restoran_id).single(),
  ]);

  if (kullanici && restoran) {
    // Öncelik WhatsApp (iptal bilgisi + "Yine de gittim" butonu); gitmezse e-posta.
    const sablonDili = whatsappSablonDili(rezervasyon.misafir_dili);
    const wa = await whatsappSablonGonder({
      telefon: kullanici.telefon,
      sablon: "masadaki_restoran_iptal",
      dil: sablonDili,
      govdeDegiskenleri: [restoran.ad, whatsappTarihMetni(rezervasyon.tarih_saat, sablonDili)],
      butonEkleri: [teyitKisaKod(rezervasyon.id, "evet")],
    });

    if (!wa.gonderildi && kullanici.eposta) {
      const { konu, html } = restoranIptalEpostasi({
        restoranAd: restoran.ad,
        tarihSaat: rezervasyon.tarih_saat,
        kisiSayisi: rezervasyon.kisi_sayisi,
        gittimUrl: teyitLinkUret(rezervasyon.id, "evet"),
        dil: rezervasyon.misafir_dili,
      });
      await bildirimGonderVeKaydet({
        rezervasyonId: rezervasyon.id,
        aliciEposta: kullanici.eposta,
        tur: "restoran_iptali",
        konu,
        html,
      });
    }
  }

  return NextResponse.json({ basari: true });
}
