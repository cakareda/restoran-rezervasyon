import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { yeniTalepEpostasi } from "@/lib/email/templates";
import { musaitlikHesapla } from "@/lib/kapasite";
import { telefonGecerliMi } from "@/lib/telefon";

export async function POST(request: Request) {
  const body = await request.json();
  const { restoranId, adSoyad, eposta, telefon, tarihSaat, kisiSayisi, notlar, ozelGun, misafirDili } =
    body;

  if (!restoranId || !adSoyad || !eposta || !tarihSaat || !kisiSayisi) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  if (!telefonGecerliMi(telefon)) {
    return NextResponse.json({ hata: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: restoran, error: restoranHata } = await supabase
    .from("restoranlar")
    .select(
      "id, ad, eposta, oturma_suresi_dk, en_erken_rezervasyon_saat, en_gec_rezervasyon_gun, maksimum_kisi_sayisi"
    )
    .eq("id", restoranId)
    .single();

  if (restoranHata || !restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  if (kisiSayisi > (restoran.maksimum_kisi_sayisi ?? 20)) {
    return NextResponse.json(
      {
        hata: `Bu restoran online rezervasyonda en fazla ${restoran.maksimum_kisi_sayisi} kişiyi kabul ediyor. Daha kalabalık gruplar için lütfen restoranı arayın.`,
      },
      { status: 400 }
    );
  }

  // Sunucu tarafında da müsaitliği doğrula (yarış durumlarına karşı) ve masa ata.
  const istenenBaslangic = new Date(tarihSaat);

  const enErkenSaat = restoran.en_erken_rezervasyon_saat ?? 1;
  if (enErkenSaat > 0) {
    const enErkenMs = Date.now() + enErkenSaat * 60 * 60 * 1000;
    if (istenenBaslangic.getTime() < enErkenMs) {
      return NextResponse.json(
        { hata: `Bu restoran en az ${enErkenSaat} saat öncesinden rezervasyon alıyor.` },
        { status: 400 }
      );
    }
  }

  const enGecGun = restoran.en_gec_rezervasyon_gun ?? 60;
  const enGecMs = Date.now() + enGecGun * 24 * 60 * 60 * 1000;
  if (istenenBaslangic.getTime() > enGecMs) {
    return NextResponse.json(
      { hata: `Bu restoran en fazla ${enGecGun} gün ileriye rezervasyon alıyor.` },
      { status: 400 }
    );
  }

  const gunBaslangic = new Date(istenenBaslangic);
  gunBaslangic.setUTCHours(0, 0, 0, 0);
  const gunBitis = new Date(istenenBaslangic);
  gunBitis.setUTCHours(23, 59, 59, 999);

  const [{ data: masalar }, { data: aktifRezervasyonlar }] = await Promise.all([
    supabase.from("masalar").select("kapasite, adet").eq("restoran_id", restoranId),
    supabase
      .from("rezervasyonlar")
      .select("tarih_saat, masa_kapasitesi")
      .eq("restoran_id", restoranId)
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
      { hata: "Bu saat için müsait masa kalmadı, farklı bir saat seçin." },
      { status: 409 }
    );
  }

  const { data: kullanici, error: kullaniciHata } = await supabase
    .from("kullanicilar")
    .upsert(
      { ad_soyad: adSoyad, eposta, telefon: telefon ?? null },
      { onConflict: "eposta" }
    )
    .select("id")
    .single();

  if (kullaniciHata || !kullanici) {
    return NextResponse.json({ hata: "Kullanıcı kaydedilemedi." }, { status: 500 });
  }

  const { data: rezervasyon, error: rezervasyonHata } = await supabase
    .from("rezervasyonlar")
    .insert({
      restoran_id: restoranId,
      kullanici_id: kullanici.id,
      tarih_saat: tarihSaat,
      kisi_sayisi: kisiSayisi,
      durum: "beklemede",
      notlar: notlar ? String(notlar).slice(0, 300) : null,
      ozel_gun: ozelGun ?? null,
      masa_kapasitesi: atanacakKapasite,
      misafir_dili: misafirDili ?? null,
    })
    .select("id")
    .single();

  if (rezervasyonHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon oluşturulamadı." }, { status: 500 });
  }

  const { konu, html } = yeniTalepEpostasi({
    restoranAd: restoran.ad,
    misafirAd: adSoyad,
    tarihSaat,
    kisiSayisi,
    panelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/restoran-panel`,
  });

  await bildirimGonderVeKaydet({
    rezervasyonId: rezervasyon.id,
    aliciEposta: restoran.eposta,
    tur: "yeni_talep",
    konu,
    html,
  });

  return NextResponse.json({ rezervasyonId: rezervasyon.id });
}
