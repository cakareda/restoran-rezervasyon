import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type SatirGirdi = {
  adSoyad: string;
  telefon: string | null;
  tarihSaat: string;
  kisiSayisi: number;
};

export async function POST(request: Request) {
  const { satirlar } = (await request.json()) as { satirlar: SatirGirdi[] };

  if (!Array.isArray(satirlar) || satirlar.length === 0) {
    return NextResponse.json({ hata: "Yüklenecek satır bulunamadı." }, { status: 400 });
  }

  const oturumClient = await createClient();
  const {
    data: { user },
  } = await oturumClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  let eklenen = 0;
  let atlanan = 0;

  for (const satir of satirlar) {
    if (!satir.adSoyad || !satir.tarihSaat || !satir.kisiSayisi) {
      atlanan++;
      continue;
    }
    const tarih = new Date(satir.tarihSaat);
    if (isNaN(tarih.getTime())) {
      atlanan++;
      continue;
    }
    const { error } = await supabase.from("rezervasyonlar").insert({
      restoran_id: restoran.id,
      kullanici_id: null,
      misafir_ad_soyad: satir.adSoyad,
      misafir_telefon: satir.telefon ?? null,
      tarih_saat: tarih.toISOString(),
      kisi_sayisi: satir.kisiSayisi,
      durum: "onaylandi",
      kaynak: "telefon",
      masa_kapasitesi: null,
    });
    if (error) atlanan++;
    else eklenen++;
  }

  return NextResponse.json({ basari: true, eklenen, atlanan });
}
