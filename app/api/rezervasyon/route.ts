import { NextResponse, after } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { bildirimGonderVeKaydet } from "@/lib/email/gonder";
import { yeniTalepEpostasi } from "@/lib/email/templates";
import { musaitlikHesapla } from "@/lib/kapasite";
import { telefonGecerliMi } from "@/lib/telefon";
import { DILLER } from "@/i18n/routing";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    restoranId,
    adSoyad,
    eposta,
    telefon,
    tarihSaat,
    kisiSayisi,
    notlar,
    notOnayi,
    ozelGun,
    alanTercihi,
    misafirDili,
  } = body;

  // Not alanı özel nitelikli veri (alerji/sağlık bilgisi) içerebilir — açık rıza
  // verilmediyse (notOnayi false/eksik), güvenlik için notu sunucu tarafında da
  // düşürüyoruz; rezervasyonun kendisini reddetmiyoruz.
  const guvenliNotlar = notOnayi ? notlar : null;

  if (!restoranId || !adSoyad || !eposta || !tarihSaat || !kisiSayisi) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  if (!telefon || !telefonGecerliMi(telefon)) {
    return NextResponse.json({ hata: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  if (!Number.isInteger(kisiSayisi) || kisiSayisi < 1 || kisiSayisi > 500) {
    return NextResponse.json({ hata: "Geçerli bir kişi sayısı girin." }, { status: 400 });
  }
  if (typeof tarihSaat !== "string" || Number.isNaN(new Date(tarihSaat).getTime())) {
    return NextResponse.json({ hata: "Geçerli bir tarih/saat girin." }, { status: 400 });
  }
  if (typeof eposta !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta) || eposta.length > 200) {
    return NextResponse.json({ hata: "Geçerli bir e-posta girin." }, { status: 400 });
  }
  // E-posta HTML gövdesine giren alanlardan "<" ">" ayıklanır (HTML enjeksiyonuna karşı).
  const temizAd = String(adSoyad).replace(/[<>]/g, "").trim().slice(0, 100);
  if (!temizAd) {
    return NextResponse.json({ hata: "Geçerli bir ad soyad girin." }, { status: 400 });
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

  // İstenen saatin ±12 saati: oturma süresi UTC gün sınırını aşsa bile (gece yarısı
  // civarı rezervasyonlar) çakışma kaçırılmasın.
  const gunBaslangic = new Date(istenenBaslangic.getTime() - 12 * 60 * 60 * 1000);
  const gunBitis = new Date(istenenBaslangic.getTime() + 12 * 60 * 60 * 1000);

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

  // Mevcut bir hesabın ad/telefonu, o hesaba giriş yapmamış biri tarafından
  // ezilemez (aksi halde başkasının e-postasıyla rezervasyon yapıp onun telefonunu
  // değiştirerek WhatsApp bildirimlerini kendine yönlendirmek mümkün olurdu).
  const oturumClient = await createClient();
  const {
    data: { user: girisYapan },
  } = await oturumClient.auth.getUser();

  const { data: mevcutKullanici } = await supabase
    .from("kullanicilar")
    .select("id, dil, auth_user_id, telefon")
    .eq("eposta", eposta)
    .maybeSingle();

  let kullanici: { id: string; dil: string | null } | null = null;

  if (!mevcutKullanici) {
    const { data: yeni } = await supabase
      .from("kullanicilar")
      .insert({ ad_soyad: temizAd, eposta, telefon })
      .select("id, dil")
      .single();
    kullanici = yeni;
  } else {
    kullanici = mevcutKullanici;
    const kendiHesabi = girisYapan && mevcutKullanici.auth_user_id === girisYapan.id;
    const sahipsizKayit = !mevcutKullanici.auth_user_id;
    if (kendiHesabi || sahipsizKayit) {
      await supabase
        .from("kullanicilar")
        .update({ ad_soyad: temizAd, telefon })
        .eq("id", mevcutKullanici.id);
    } else if (!mevcutKullanici.telefon) {
      await supabase.from("kullanicilar").update({ telefon }).eq("id", mevcutKullanici.id);
    }
  }

  if (!kullanici) {
    return NextResponse.json({ hata: "Kullanıcı kaydedilemedi." }, { status: 500 });
  }

  // Dil önceliği: profildeki tercih > rezervasyonun yapıldığı sayfa dili. Profilde dil
  // yoksa sayfa dili profile de yazılır (bildirimler hep aynı dilde gitsin).
  const sayfaDili = DILLER.includes(misafirDili) ? (misafirDili as string) : null;
  const etkinDil = kullanici.dil ?? sayfaDili;
  if (!kullanici.dil && sayfaDili) {
    await supabase.from("kullanicilar").update({ dil: sayfaDili }).eq("id", kullanici.id);
  }

  const { data: rezervasyon, error: rezervasyonHata } = await supabase
    .from("rezervasyonlar")
    .insert({
      restoran_id: restoranId,
      kullanici_id: kullanici.id,
      tarih_saat: tarihSaat,
      kisi_sayisi: kisiSayisi,
      durum: "beklemede",
      notlar: guvenliNotlar ? String(guvenliNotlar).slice(0, 300) : null,
      ozel_gun: ozelGun ?? null,
      alan_tercihi: alanTercihi ?? null,
      masa_kapasitesi: atanacakKapasite,
      misafir_dili: etkinDil,
    })
    .select("id")
    .single();

  if (rezervasyonHata || !rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon oluşturulamadı." }, { status: 500 });
  }

  const { konu, html } = yeniTalepEpostasi({
    restoranAd: restoran.ad,
    misafirAd: temizAd,
    tarihSaat,
    kisiSayisi,
    panelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/restoran-panel`,
  });

  // E-posta gönderimini yanıtı geciktirmeden arka planda yap (misafir "Gönderiliyor..."
  // ekranında uzun süre beklemesin) — after() yanıt döndükten sonra da Vercel'in isteği
  // tamamlanmış sayıp fonksiyonu durdurmasını engelliyor.
  after(() =>
    bildirimGonderVeKaydet({
      rezervasyonId: rezervasyon.id,
      aliciEposta: restoran.eposta,
      tur: "yeni_talep",
      konu,
      html,
    })
  );

  return NextResponse.json({ rezervasyonId: rezervasyon.id });
}
