import { NextResponse } from "next/server";
import { sozlesmeEngeli } from "@/lib/sozlesme";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { onayEpostasi } from "@/lib/email/templates";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const servis = createServiceRoleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  // RLS zaten bunu veritabanı seviyesinde engelliyor (bkz. rezervasyonlar_restoran_gunceller
  // politikası); burada ayrıca açıkça kontrol etmek hem net bir 403 döndürür hem de tek
  // savunma hattı olarak RLS'e güvenmemizi önler.
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

  const { data: rezervasyon, error: guncelHata } = await servis
    .from("rezervasyonlar")
    .update({ durum: "onaylandi" })
    .eq("id", id)
    .eq("restoran_id", restoranSahiplik.id)
    .eq("durum", "beklemede")
    .select("id, tarih_saat, kisi_sayisi, kullanici_id, restoran_id, misafir_dili")
    .single();

  if (guncelHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon güncellenemedi." }, { status: 404 });
  }

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
    const { konu, html } = onayEpostasi({
      restoranAd: restoran.ad,
      tarihSaat: rezervasyon.tarih_saat,
      kisiSayisi: rezervasyon.kisi_sayisi,
      iptalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/rezervasyon/${rezervasyon.id}/iptal`,
      degistirUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/rezervasyon/${rezervasyon.id}/iptal?degistir=1`,
      dil: rezervasyon.misafir_dili,
    });
    await bildirimGonderVeKaydet({
      rezervasyonId: rezervasyon.id,
      aliciEposta: kullanici.eposta,
      tur: "onay",
      konu,
      html,
    });
  }

  return NextResponse.json({ basari: true });
}
