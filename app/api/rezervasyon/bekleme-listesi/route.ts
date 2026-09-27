import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { restoranId, adSoyad, eposta, telefon, tarih, saat, kisiSayisi } = body;

  if (!restoranId || !adSoyad || !eposta || !tarih || !saat || !kisiSayisi) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("bekleme_listesi").insert({
    restoran_id: restoranId,
    ad_soyad: adSoyad,
    eposta,
    telefon: telefon ?? null,
    tarih,
    saat,
    kisi_sayisi: kisiSayisi,
  });

  if (error) {
    return NextResponse.json({ hata: "Bekleme listesine eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
