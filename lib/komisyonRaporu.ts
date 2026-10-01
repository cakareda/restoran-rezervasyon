import { createServiceRoleClient } from "@/lib/supabase/server";
import { fiyatSeviyesi } from "@/lib/format";

// Aylık komisyon raporu hesaplama mantığı — hem /api/admin/komisyon-raporu
// (dış paylaşım/anahtar korumalı) hem /admin/komisyon-raporu (panel içi,
// giriş korumalı) burayı kullanır, mantık tek yerde yaşasın diye.
//
// TAHAKKUK MANTIĞI (sözleşme Madde 6.4 ile birebir): bir rezervasyon "rezervasyon
// tarihinde" değil, "gerçekleştiği kesinleştiğinde" faturaya girer:
//   - misafir "evet" derse  -> tahakkuk anı = misafirin onay zamanı
//   - misafir "hayır" derse -> hiç tahakkuk etmez (itirazlı, 0 TL)
//   - misafir 48 saat yanıt vermezse -> tahakkuk anı = rezervasyon saati + 48 saat (sessizlikle kesinleşme)
//   - 48 saat henüz dolmadıysa -> henüz tahakkuk etmedi, bu ayın raporuna GİRMEZ,
//     tahakkuk ettiği ayın raporunda (genelde sonraki ay) otomatik çıkar.

const KADEME_TUTARLARI: Record<1 | 2 | 3 | 4, number> = { 1: 15, 2: 20, 3: 30, 4: 39 };
const UCRETSIZ_DONEM_AY = 6;
const ITIRAZ_PENCERESI_SAAT = 48;
// Sorguyu daraltmak için makul bir güvenlik payı (48 saatten biraz fazla).
const SORGU_TAMPON_GUN = 4;

export type KomisyonSatiri = {
  restoranId: string;
  restoranAd: string;
  restoranEposta: string;
  ucretsizDonemBitisi: string;
  kesinlesmisMisafirSayisi: number;
  itirazliSayisi: number;
  toplamTutar: number;
};

type Rezervasyon = {
  id: string;
  restoran_id: string;
  tarih_saat: string;
  misafir_teyit: boolean | null;
  misafir_teyit_zamani: string | null;
};

export function ayAraligi(ayParam: string | null | undefined): {
  baslangic: Date;
  bitis: Date;
  etiket: string;
} {
  const simdi = new Date();
  const [yilStr, ayStr] = (ayParam ?? "").split("-");
  const yil = Number(yilStr) || simdi.getUTCFullYear();
  const ay = Number(ayStr) || simdi.getUTCMonth() + 1;
  const baslangic = new Date(Date.UTC(yil, ay - 1, 1));
  const bitis = new Date(Date.UTC(yil, ay, 1));
  return { baslangic, bitis, etiket: `${yil}-${String(ay).padStart(2, "0")}` };
}

/** Bir rezervasyonun ne zaman (ve "evet"/"sessizlik"/"hayır" olarak) kesinleştiğini hesaplar.
 *  Henüz kesinleşmediyse (48 saat dolmadıysa) null döner — rapor bu kaydı yok sayar. */
function tahakkukDurumu(
  r: Rezervasyon,
  simdi: number
): { zaman: number; kesinlesmeSekli: "onay" | "sessizlik" | "itiraz" } | null {
  if (r.misafir_teyit === false) {
    const itirazZamani = r.misafir_teyit_zamani ? new Date(r.misafir_teyit_zamani).getTime() : simdi;
    return { zaman: itirazZamani, kesinlesmeSekli: "itiraz" };
  }
  if (r.misafir_teyit === true) {
    const onayZamani = r.misafir_teyit_zamani ? new Date(r.misafir_teyit_zamani).getTime() : simdi;
    return { zaman: onayZamani, kesinlesmeSekli: "onay" };
  }
  const sessizlikZamani = new Date(r.tarih_saat).getTime() + ITIRAZ_PENCERESI_SAAT * 60 * 60 * 1000;
  if (simdi < sessizlikZamani) return null;
  return { zaman: sessizlikZamani, kesinlesmeSekli: "sessizlik" };
}

export async function komisyonRaporuHesapla(ayParam: string | null | undefined) {
  const { baslangic, bitis, etiket } = ayAraligi(ayParam);
  const supabase = createServiceRoleClient();

  const { data: restoranlar, error: restoranHata } = await supabase
    .from("restoranlar")
    .select("id, ad, eposta, olusturulma, fiyat_seviyesi, ortalama_fiyat");
  if (restoranHata) throw new Error("Restoranlar okunamadı.");

  const sorguBaslangic = new Date(baslangic.getTime() - SORGU_TAMPON_GUN * 24 * 60 * 60 * 1000);
  const sorguBitis = new Date(bitis.getTime());

  const [{ data: tarihAraligindakiler, error: hata1 }, { data: gecYanitlar, error: hata2 }] =
    await Promise.all([
      supabase
        .from("rezervasyonlar")
        .select("id, restoran_id, tarih_saat, misafir_teyit, misafir_teyit_zamani")
        .eq("kaynak", "online")
        .eq("geldi_mi", true)
        .gte("tarih_saat", sorguBaslangic.toISOString())
        .lt("tarih_saat", sorguBitis.toISOString()),
      supabase
        .from("rezervasyonlar")
        .select("id, restoran_id, tarih_saat, misafir_teyit, misafir_teyit_zamani")
        .eq("kaynak", "online")
        .eq("geldi_mi", true)
        .not("misafir_teyit", "is", null)
        .gte("misafir_teyit_zamani", baslangic.toISOString())
        .lt("misafir_teyit_zamani", bitis.toISOString()),
    ]);

  if (hata1 || hata2) throw new Error("Rezervasyonlar okunamadı.");

  const hepsi = new Map<string, Rezervasyon>();
  for (const r of [...(tarihAraligindakiler ?? []), ...(gecYanitlar ?? [])]) hepsi.set(r.id, r);

  const donemBitisleri = new Map<string, number>();
  for (const r of restoranlar ?? []) {
    const bitisTarihi = new Date(r.olusturulma);
    bitisTarihi.setUTCMonth(bitisTarihi.getUTCMonth() + UCRETSIZ_DONEM_AY);
    donemBitisleri.set(r.id, bitisTarihi.getTime());
  }

  const simdi = Date.now();
  let bekleyenToplam = 0;

  type Kesinlesme = { restoran_id: string; kesinlesmeSekli: "onay" | "sessizlik" | "itiraz" };
  const buAyKesinlesenler: Kesinlesme[] = [];

  for (const r of hepsi.values()) {
    const donemBitis = donemBitisleri.get(r.restoran_id);
    if (donemBitis === undefined || new Date(r.tarih_saat).getTime() < donemBitis) continue;

    const durum = tahakkukDurumu(r, simdi);
    if (!durum) {
      bekleyenToplam++;
      continue;
    }
    if (durum.zaman >= baslangic.getTime() && durum.zaman < bitis.getTime()) {
      buAyKesinlesenler.push({ restoran_id: r.restoran_id, kesinlesmeSekli: durum.kesinlesmeSekli });
    }
  }

  const satirlar: KomisyonSatiri[] = (restoranlar ?? []).map((r) => {
    const onaylananVeSessiz = buAyKesinlesenler.filter(
      (k) => k.restoran_id === r.id && k.kesinlesmeSekli !== "itiraz"
    ).length;
    const itirazli = buAyKesinlesenler.filter(
      (k) => k.restoran_id === r.id && k.kesinlesmeSekli === "itiraz"
    ).length;

    const seviye = fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi) ?? 1;
    const tutar = onaylananVeSessiz * KADEME_TUTARLARI[seviye];

    return {
      restoranId: r.id,
      restoranAd: r.ad,
      restoranEposta: r.eposta,
      ucretsizDonemBitisi: new Date(donemBitisleri.get(r.id)!).toISOString(),
      kesinlesmisMisafirSayisi: onaylananVeSessiz,
      itirazliSayisi: itirazli,
      toplamTutar: tutar,
    };
  });

  return { ay: etiket, satirlar, bekleyenToplam };
}
