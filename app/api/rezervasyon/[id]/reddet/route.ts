import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { redEpostasi } from "@/lib/email/templates";

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

  const { data: rezervasyon, error: guncelHata } = await supabase
    .from("rezervasyonlar")
    .update({ durum: "reddedildi" })
    .eq("id", id)
    .select("id, tarih_saat, kullanici_id, restoran_id")
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
