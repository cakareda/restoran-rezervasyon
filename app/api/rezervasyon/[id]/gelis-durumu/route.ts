import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { yorumDavetiEpostasi } from "@/lib/email/templates";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { geldiMi } = await request.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { data: rezervasyon, error: guncelHata } = await supabase
    .from("rezervasyonlar")
    .update({ geldi_mi: geldiMi })
    .eq("id", id)
    .eq("durum", "onaylandi")
    .select("id, kullanici_id, restoran_id, misafir_dili")
    .single();

  if (guncelHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon güncellenemedi." }, { status: 404 });
  }

  if (geldiMi) {
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

  return NextResponse.json({ basari: true });
}
