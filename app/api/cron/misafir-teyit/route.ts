import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { gelisTeyitEpostasi } from "@/lib/email/templates";
import { teyitLinkUret, teyitKisaKod } from "@/lib/misafirTeyit";
import { whatsappSablonGonder, whatsappSablonDili, whatsappTarihMetni } from "@/lib/whatsapp";

// Rezervasyon saatinden ~1 saat sonra, restoranın Geldi/No-Show işaretlemesinden
// BAĞIMSIZ olarak misafire "Rezervasyonunuza gittiniz mi?" maili gönderir.
// Misafirin yanıtı doğrudan kanıt değil, uyuşmazlık sinyalidir; yanıt vermemesi
// bir sorun oluşturmaz (bkz. lib/komisyonRaporu.ts).
// Vercel Cron her 15 dakikada bir çağırır (bkz. vercel.json).
const GONDERIM_GECIKMESI_DK = 60;
const EN_GEC_SAAT = 48;

export async function GET(request: Request) {
  const yetkiBasligi = request.headers.get("authorization");
  if (process.env.CRON_SECRET && yetkiBasligi !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const simdi = Date.now();

  const { data: rezervasyonlar, error } = await supabase
    .from("rezervasyonlar")
    .select("id, restoran_id, tarih_saat, misafir_dili, kullanicilar(ad_soyad, eposta, telefon)")
    .eq("durum", "onaylandi")
    .eq("teyit_gonderildi", false)
    .not("kullanici_id", "is", null)
    .lt("tarih_saat", new Date(simdi - GONDERIM_GECIKMESI_DK * 60000).toISOString())
    .gt("tarih_saat", new Date(simdi - EN_GEC_SAAT * 3600000).toISOString())
    .limit(100);

  if (error) {
    return NextResponse.json({ hata: "Sorgu başarısız." }, { status: 500 });
  }

  const restoranAdlari = new Map<string, string>();
  let gonderilen = 0;

  for (const r of rezervasyonlar ?? []) {
    const kullanici = (Array.isArray(r.kullanicilar) ? r.kullanicilar[0] : r.kullanicilar) as {
      ad_soyad: string | null;
      eposta: string | null;
      telefon: string | null;
    } | null;

    if (kullanici?.eposta || kullanici?.telefon) {
      if (!restoranAdlari.has(r.restoran_id)) {
        const { data: restoran } = await supabase
          .from("restoranlar")
          .select("ad")
          .eq("id", r.restoran_id)
          .single();
        restoranAdlari.set(r.restoran_id, restoran?.ad ?? "");
      }
      const restoranAd = restoranAdlari.get(r.restoran_id);

      if (restoranAd) {
        // Öncelik WhatsApp (daha yüksek açılma/yanıt oranı); gitmezse e-postaya düş.
        const sablonDili = whatsappSablonDili(r.misafir_dili);
        const ilkAd = (kullanici.ad_soyad ?? "").trim().split(/\s+/)[0] || "Misafir";
        const wa = await whatsappSablonGonder({
          telefon: kullanici.telefon,
          sablon: "masadaki_teyit",
          dil: sablonDili,
          govdeDegiskenleri: [ilkAd, restoranAd, whatsappTarihMetni(r.tarih_saat, sablonDili)],
          butonEkleri: [teyitKisaKod(r.id, "evet"), teyitKisaKod(r.id, "hayir")],
        });

        if (wa.gonderildi) {
          gonderilen++;
        } else if (kullanici.eposta) {
          const { konu, html } = gelisTeyitEpostasi({
            restoranAd,
            evetUrl: teyitLinkUret(r.id, "evet"),
            hayirUrl: teyitLinkUret(r.id, "hayir"),
            dil: r.misafir_dili,
          });
          await bildirimGonderVeKaydet({
            rezervasyonId: r.id,
            aliciEposta: kullanici.eposta,
            tur: "gelis_teyidi",
            konu,
            html,
          });
          gonderilen++;
        }
      }
    }

    // İletişim bilgisi olmayan misafirler için de tekrar tekrar denenmesin.
    await supabase.from("rezervasyonlar").update({ teyit_gonderildi: true }).eq("id", r.id);
  }

  return NextResponse.json({ gonderilen });
}
