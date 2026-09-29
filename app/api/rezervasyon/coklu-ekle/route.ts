import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { musaitlikHesapla, type AktifRezervasyon } from "@/lib/kapasite";

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
    .select("id, oturma_suresi_dk")
    .eq("auth_user_id", user.id)
    .single();

  if (!restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  const { data: masalar } = await supabase
    .from("masalar")
    .select("kapasite, adet")
    .eq("restoran_id", restoran.id);

  // Gelecekteki (henüz gerçekleşmemiş) satırlar için canlı takvimle çakışma kontrolü
  // yapılır ve masa atanır; geçmiş tarihli satırlar (Quandoo'dan taşınan geçmiş misafir
  // kayıtları gibi) yalnızca kayıt amaçlı eklenir, masa/müsaitlik kontrolüne girmez.
  const { data: mevcutAktifler } = await supabase
    .from("rezervasyonlar")
    .select("tarih_saat, masa_kapasitesi")
    .eq("restoran_id", restoran.id)
    .in("durum", ["beklemede", "onaylandi"])
    .gte("tarih_saat", new Date().toISOString());

  const simulasyonListesi: AktifRezervasyon[] = [...(mevcutAktifler ?? [])];

  let eklenen = 0;
  let atlanan = 0;
  let musaitDegil = 0;

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

    const gelecekteMi = tarih.getTime() > Date.now();
    let atanacakKapasite: number | null = null;

    if (gelecekteMi) {
      const { musait, atanacakKapasite: kapasite } = musaitlikHesapla({
        istenenBaslangic: tarih,
        kisiSayisi: satir.kisiSayisi,
        oturmaSuresiDk: restoran.oturma_suresi_dk ?? 90,
        masalar: masalar ?? [],
        aktifRezervasyonlar: simulasyonListesi,
      });

      if (!musait) {
        musaitDegil++;
        continue;
      }
      atanacakKapasite = kapasite;
      simulasyonListesi.push({ tarih_saat: tarih.toISOString(), masa_kapasitesi: atanacakKapasite });
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
      masa_kapasitesi: atanacakKapasite,
    });
    if (error) atlanan++;
    else eklenen++;
  }

  return NextResponse.json({ basari: true, eklenen, atlanan, musaitDegil });
}
