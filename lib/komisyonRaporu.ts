import { createServiceRoleClient } from "@/lib/supabase/server";
import { fiyatSeviyesi } from "@/lib/format";

// Aylık komisyon raporu — sözleşme V1.0 modeli (Madde 2, 8, 9, Ek-2, Ek-4).
// Hem /api/admin/komisyon-raporu (anahtarlı link) hem /admin/komisyon-raporu
// (giriş korumalı) bu fonksiyonu kullanır.
//
// ÜCRETLENDİRME: Masadaki kaynaklı (kaynak=online), onaylanmış bir rezervasyon;
// iptal edilmediyse ve geçerli şekilde No-Show işaretlenmediyse ücretlidir.
// Tutar = rezervasyondaki kişi sayısı × segmentin kişi başı bedeli (+ KDV, rapor KDV içermez).
//
// TAHAKKUK ZAMANI (hangi ayın raporuna girer):
//   - Restoran "Geldi" dediyse             -> rezervasyon saati
//   - Hiçbir işaret yoksa                  -> rezervasyon saati + 12 saat (bildirim süresi doldu)
//   - Restoran "Gelmedi" (No-Show) dediyse -> ücret yok. Ancak misafir "gittim" diye
//     teyit ettiyse bu bir İNCELEME kaydıdır (Madde 9.6): otomatik faturalanmaz, ayrıca listelenir.
//   - Misafir "gitmedim" dese bile restoran "Geldi" demişse ücretli kalır, ama UYARI olarak sayılır.
//   - Tahakkuk zamanı henüz gelmediyse rapora girmez (bekleyen).

export const KADEME_TUTARLARI: Record<1 | 2 | 3 | 4, number> = { 1: 15, 2: 30, 3: 60, 4: 120 };
export const UCRETSIZ_DONEM_AY = 6;
// Restoran rezervasyon saatinden itibaren bu süre içinde Geldi/No-Show bildirmezse ücret doğar.
export const NOSHOW_PENCERESI_SAAT = 12;
// Bu tutarın üzerindeki No-Show iddiaları misafir yanıtından bağımsız incelemeye düşer.
export const YUKSEK_TUTAR_ESIGI = 1000;
const SORGU_TAMPON_GUN = 4;

export type KomisyonSatiri = {
  restoranId: string;
  restoranAd: string;
  restoranEposta: string;
  kurucuRestoran: boolean;
  ucretsizDonemBitisi: string;
  ucretliRezervasyonSayisi: number;
  ucretliKisiSayisi: number;
  misafirUyarisiSayisi: number;
  incelemeSayisi: number;
  toplamTutar: number;
};

type Rezervasyon = {
  id: string;
  restoran_id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  geldi_mi: boolean | null;
  misafir_teyit: boolean | null;
  durum: string;
  iptal_eden: string | null;
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

export function ucretsizDonemBitisi(aktivasyon: string, kurucu: boolean): Date {
  const bitis = new Date(aktivasyon);
  if (kurucu) bitis.setUTCMonth(bitis.getUTCMonth() + UCRETSIZ_DONEM_AY);
  return bitis;
}

export async function komisyonRaporuHesapla(ayParam: string | null | undefined) {
  const { baslangic, bitis, etiket } = ayAraligi(ayParam);
  const supabase = createServiceRoleClient();

  const { data: restoranlar, error: restoranHata } = await supabase
    .from("restoranlar")
    .select("id, ad, eposta, kurucu_restoran, aktivasyon_tarihi, fiyat_seviyesi, ortalama_fiyat");
  if (restoranHata) throw new Error("Restoranlar okunamadı.");

  const sorguBaslangic = new Date(baslangic.getTime() - SORGU_TAMPON_GUN * 24 * 60 * 60 * 1000);

  const { data: rezervasyonlar, error: rezHata } = await supabase
    .from("rezervasyonlar")
    .select("id, restoran_id, tarih_saat, kisi_sayisi, geldi_mi, misafir_teyit, durum, iptal_eden")
    .eq("kaynak", "online")
    .in("durum", ["onaylandi", "iptal_edildi"])
    .gte("tarih_saat", sorguBaslangic.toISOString())
    .lt("tarih_saat", bitis.toISOString());
  if (rezHata) throw new Error("Rezervasyonlar okunamadı.");

  const donemBitisleri = new Map<string, number>();
  for (const r of restoranlar ?? []) {
    donemBitisleri.set(
      r.id,
      ucretsizDonemBitisi(r.aktivasyon_tarihi, r.kurucu_restoran).getTime()
    );
  }

  const seviyeler = new Map<string, 1 | 2 | 3 | 4>();
  for (const r of restoranlar ?? []) {
    seviyeler.set(r.id, fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi) ?? 1);
  }

  const simdi = Date.now();
  let bekleyenToplam = 0;

  type Kayit = { restoran_id: string; kisi: number; tur: "ucretli" | "uyari" | "inceleme" };
  const buAy: Kayit[] = [];

  for (const r of (rezervasyonlar ?? []) as Rezervasyon[]) {
    const donemBitis = donemBitisleri.get(r.restoran_id);
    const rezZamani = new Date(r.tarih_saat).getTime();
    if (donemBitis === undefined || rezZamani < donemBitis) continue;

    // Restoran iptal etti ama misafir "yine de gittim" dediyse: incelemeye düşer (Madde 9.6 / platform dışı yönlendirme).
    if (r.durum === "iptal_edildi") {
      if (r.iptal_eden !== "restoran" || r.misafir_teyit !== true) continue;
      if (rezZamani >= baslangic.getTime() && rezZamani < bitis.getTime() && simdi >= rezZamani) {
        buAy.push({ restoran_id: r.restoran_id, kisi: r.kisi_sayisi, tur: "inceleme" });
      }
      continue;
    }

    const pencereBitisi = rezZamani + NOSHOW_PENCERESI_SAAT * 60 * 60 * 1000;
    let tahakkuk: number;
    let tur: Kayit["tur"];

    if (r.geldi_mi === false) {
      const seviye = seviyeler.get(r.restoran_id) ?? 1;
      const yuksekTutar = r.kisi_sayisi * KADEME_TUTARLARI[seviye] >= YUKSEK_TUTAR_ESIGI;
      if (r.misafir_teyit !== true && !yuksekTutar) continue;
      tahakkuk = pencereBitisi;
      tur = "inceleme";
    } else if (r.geldi_mi === true) {
      tahakkuk = rezZamani;
      tur = r.misafir_teyit === false ? "uyari" : "ucretli";
    } else {
      tahakkuk = pencereBitisi;
      tur = r.misafir_teyit === false ? "uyari" : "ucretli";
    }

    if (simdi < tahakkuk) {
      bekleyenToplam++;
      continue;
    }
    if (tahakkuk >= baslangic.getTime() && tahakkuk < bitis.getTime()) {
      buAy.push({ restoran_id: r.restoran_id, kisi: r.kisi_sayisi, tur });
    }
  }

  const satirlar: KomisyonSatiri[] = (restoranlar ?? []).map((r) => {
    const buRestoran = buAy.filter((k) => k.restoran_id === r.id);
    const ucretliler = buRestoran.filter((k) => k.tur !== "inceleme");
    const ucretliKisi = ucretliler.reduce((t, k) => t + k.kisi, 0);

    const seviye = fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi) ?? 1;

    return {
      restoranId: r.id,
      restoranAd: r.ad,
      restoranEposta: r.eposta,
      kurucuRestoran: r.kurucu_restoran,
      ucretsizDonemBitisi: new Date(donemBitisleri.get(r.id)!).toISOString(),
      ucretliRezervasyonSayisi: ucretliler.length,
      ucretliKisiSayisi: ucretliKisi,
      misafirUyarisiSayisi: buRestoran.filter((k) => k.tur === "uyari").length,
      incelemeSayisi: buRestoran.filter((k) => k.tur === "inceleme").length,
      toplamTutar: ucretliKisi * KADEME_TUTARLARI[seviye],
    };
  });

  return { ay: etiket, satirlar, bekleyenToplam };
}
