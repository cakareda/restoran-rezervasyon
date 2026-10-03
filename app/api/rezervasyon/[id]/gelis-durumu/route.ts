import { NextResponse } from "next/server";
import { sozlesmeEngeli } from "@/lib/sozlesme";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { yorumDavetiEpostasi } from "@/lib/email/templates";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { geldiMi } = await request.json();

  const supabase = await createClient();
  const servis = createServiceRoleClient();
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

  const sozlesmeEngel = await sozlesmeEngeli(restoranSahiplik.id);
  if (sozlesmeEngel) return sozlesmeEngel;

  const { data: mevcutRezervasyon } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat")
    .eq("id", id)
    .eq("restoran_id", restoranSahiplik.id)
    .eq("durum", "onaylandi")
    .maybeSingle();

  if (!mevcutRezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon bulunamadı." }, { status: 404 });
  }

  const rezervasyonZamani = new Date(mevcutRezervasyon.tarih_saat).getTime();

  if (geldiMi === true) {
    const ERKEN_ISARETLEME_TOLERANSI_DK = 30;
    const enErkenIsaretlemeZamani = rezervasyonZamani - ERKEN_ISARETLEME_TOLERANSI_DK * 60 * 1000;
    if (Date.now() < enErkenIsaretlemeZamani) {
      return NextResponse.json(
        { hata: "Bu rezervasyon için henüz 'Geldi' işaretlenemez — rezervasyon saati gelmedi." },
        { status: 400 }
      );
    }
  }

  // Sözleşme Madde 9.2 / Ek-4: No-Show, rezervasyon saatinden 30 dakika sonra
  // başlayıp 12 saat içinde bildirilebilir.
  if (geldiMi === false) {
    const simdi = Date.now();
    if (simdi < rezervasyonZamani + 30 * 60 * 1000) {
      return NextResponse.json(
        { hata: "No-Show, rezervasyon saatinden en az 30 dakika sonra işaretlenebilir." },
        { status: 400 }
      );
    }
    if (simdi > rezervasyonZamani + 12 * 60 * 60 * 1000) {
      return NextResponse.json(
        { hata: "No-Show bildirim süresi (rezervasyon saatinden itibaren 12 saat) doldu." },
        { status: 400 }
      );
    }
  }

  const { data: rezervasyon, error: guncelHata } = await servis
    .from("rezervasyonlar")
    .update({
      geldi_mi: geldiMi,
      no_show_bildirim_zamani: geldiMi === false ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("restoran_id", restoranSahiplik.id)
    .eq("durum", "onaylandi")
    .select("id, kullanici_id, restoran_id, misafir_dili")
    .single();

  if (guncelHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon güncellenemedi." }, { status: 404 });
  }

  if (geldiMi === true) {
    const [{ data: kullanici }, { data: restoran }] = await Promise.all([
      supabase
        .from("kullanicilar")
        .select("eposta")
        .eq("id", rezervasyon.kullanici_id)
        .single(),
      supabase
        .from("restoranlar")
        .select("ad")
        .eq("id", rezervasyon.restoran_id)
        .single(),
    ]);

    if (kullanici && restoran) {
      if (geldiMi === true) {
        const { konu, html } = yorumDavetiEpostasi({
          restoranAd: restoran.ad,
          yorumUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/yorum/${rezervasyon.id}`,
          dil: rezervasyon.misafir_dili,
        });
        await bildirimGonderVeKaydet({
          rezervasyonId: rezervasyon.id,
          aliciEposta: kullanici.eposta,
          tur: "yorum_daveti",
          konu,
          html,
        });
      }
    }
  }

  return NextResponse.json({ basari: true });
}
