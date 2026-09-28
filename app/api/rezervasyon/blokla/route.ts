import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { musaitlikHesapla } from "@/lib/kapasite";

export async function POST(request: Request) {
  const { adSoyad, telefon, tarihSaat, kisiSayisi } = await request.json();

  if (!adSoyad || !tarihSaat || !kisiSayisi) {
    return NextResponse.json({ hata: "Ad soyad, tarih/saat ve kişi sayısı gerekli." }, { status: 400 });
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
    .select("id, oturma_suresi_dk")
    .eq("auth_user_id", user.id)
    .single();

  if (!restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  const istenenBaslangic = new Date(tarihSaat);
  const gunBaslangic = new Date(istenenBaslangic);
  gunBaslangic.setUTCHours(0, 0, 0, 0);
  const gunBitis = new Date(istenenBaslangic);
  gunBitis.setUTCHours(23, 59, 59, 999);

  const [{ data: masalar }, { data: aktifRezervasyonlar }] = await Promise.all([
    supabase.from("masalar").select("kapasite, adet").eq("restoran_id", restoran.id),
    supabase
      .from("rezervasyonlar")
      .select("tarih_saat, masa_kapasitesi")
      .eq("restoran_id", restoran.id)
      .in("durum", ["beklemede", "onaylandi"])
      .gte("tarih_saat", gunBaslangic.toISOString())
      .lte("tarih_saat", gunBitis.toISOString()),
  ]);

  const { musait, atanacakKapasite } = musaitlikHesapla({
    istenenBaslangic,
    kisiSayisi,
    oturmaSuresiDk: restoran.oturma_suresi_dk ?? 90,
    masalar: masalar ?? [],
    aktifRezervasyonlar: aktifRezervasyonlar ?? [],
  });

  if (!musait) {
    return NextResponse.json(
      { hata: "Bu saatte müsait masa yok. Farklı bir saat veya masa seçin." },
      { status: 409 }
    );
  }

  const { data: rezervasyon, error } = await supabase
    .from("rezervasyonlar")
    .insert({
      restoran_id: restoran.id,
      kullanici_id: null,
      misafir_ad_soyad: adSoyad,
      misafir_telefon: telefon ?? null,
      tarih_saat: tarihSaat,
      kisi_sayisi: kisiSayisi,
      durum: "onaylandi",
      kaynak: "telefon",
      masa_kapasitesi: atanacakKapasite,
    })
    .select("id")
    .single();

  if (error || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ basari: true, rezervasyonId: rezervasyon.id });
}
