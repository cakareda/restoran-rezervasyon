import { NextResponse } from "next/server";
import { sozlesmeEngeli } from "@/lib/sozlesme";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { redEpostasi } from "@/lib/email/templates";

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
    .update({ durum: "reddedildi" })
    .eq("id", id)
    .eq("restoran_id", restoranSahiplik.id)
    .eq("durum", "beklemede")
    .select("id, tarih_saat, kullanici_id, restoran_id, misafir_dili")
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
    const { konu, html } = redEpostasi({
      restoranAd: restoran.ad,
      tarihSaat: rezervasyon.tarih_saat,
      dil: rezervasyon.misafir_dili,
    });
    await bildirimGonderVeKaydet({
      rezervasyonId: rezervasyon.id,
      aliciEposta: kullanici.eposta,
      tur: "red",
      konu,
      html,
    });
  }

  return NextResponse.json({ basari: true });
}
