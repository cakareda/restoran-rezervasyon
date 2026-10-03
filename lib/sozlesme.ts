import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fiyatSeviyesi } from "@/lib/format";
import { FIYAT_ARALIKLARI } from "@/lib/types";
import { KADEME_TUTARLARI, UCRETSIZ_DONEM_AY } from "@/lib/komisyonRaporu";

// Restoran sözleşmesinin yürürlükteki sürümü. Avukat onaylı yeni metin geldiğinde burası
// ve public/sozlesmeler altındaki PDF'ler güncellenir; yeni sürümü henüz kabul etmemiş
// restoranlar panele girişte yeniden imzaya yönlendirilir.
export const SOZLESME_SURUMU = "V1.0";

export const KURULUM_BEDELI_TL = 2500;
export const SOZLESME_SURESI_AY = 12;

export type SozlesmeBelgesi = {
  kod: "ana" | "ek1" | "ek2" | "ek3" | "ek4";
  ad: string;
  /** PDF/belge adresi; null ise belge sayfada dinamik gösterilir (Ek-1, Ek-2). */
  url: string | null;
};

// PDF'leri public/sozlesmeler klasörüne bu adlarla koy (kabul anında içerikleri SHA-256 ile
// karma alınıp kayda yazılır; dosya yoksa imza reddedilir).
export const SOZLESME_BELGELERI: SozlesmeBelgesi[] = [
  {
    kod: "ana",
    ad: "Masadaki – Restoran Hizmet ve İş Birliği Sözleşmesi",
    url: "/sozlesmeler/masadaki-restoran-sozlesmesi-v1.0.pdf",
  },
  { kod: "ek1", ad: "Ek-1 – Restorana Özel Ticari Koşullar", url: null },
  { kod: "ek2", ad: "Ek-2 – Segmentasyon ve Fiyatlandırma Kuralları", url: null },
  { kod: "ek3", ad: "Ek-3 – Kişisel Veriler", url: "/sozlesmeler/ek-3-kisisel-veriler-v1.0.pdf" },
  {
    kod: "ek4",
    ad: "Ek-4 – Platform ve Rezervasyon Kuralları",
    url: "/sozlesmeler/ek-4-platform-ve-rezervasyon-kurallari-v1.0.pdf",
  },
];

export function sozlesmeZorunluMu() {
  return process.env.SOZLESME_ZORUNLU === "1";
}

type RestoranTicari = {
  ad: string;
  fiyat_seviyesi: number | null;
  ortalama_fiyat: string | null;
  kurucu_restoran: boolean;
  aktivasyon_tarihi: string;
  uyelik_paketi?: string | null;
  uyelik_aylik_ucret_tl?: number | string | null;
  hesaplasma_donemi?: string | null;
  odeme_vadesi_gun?: number | null;
  odeme_yontemi?: string | null;
};

export const RESTORAN_TICARI_SECIM =
  "ad, fiyat_seviyesi, ortalama_fiyat, kurucu_restoran, aktivasyon_tarihi, uyelik_paketi, uyelik_aylik_ucret_tl, hesaplasma_donemi, odeme_vadesi_gun, odeme_yontemi";

/** Süresi dolmamış, güncel sürüme ait kabulü döner (yoksa null). */
export async function gecerliKabulBul(
  client: { from: (t: string) => any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  restoranId: string
): Promise<{ id: string; sozlesme_bitis: string } | null> {
  const { data } = await client
    .from("sozlesme_kabulleri")
    .select("id, sozlesme_bitis")
    .eq("restoran_id", restoranId)
    .eq("sozlesme_surumu", SOZLESME_SURUMU)
    .gt("sozlesme_bitis", new Date().toISOString())
    .order("sozlesme_bitis", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Ek-1 / Ek-2'de gösterilen ve kabul anında kayda yazılan ticari koşullar (tek kaynak). */
export function ticariKosullariHesapla(r: RestoranTicari) {
  const seviye = fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi);
  if (!seviye) return null;

  const aktivasyon = new Date(r.aktivasyon_tarihi);
  const ucretsizBitis = new Date(aktivasyon);
  if (r.kurucu_restoran) ucretsizBitis.setUTCMonth(ucretsizBitis.getUTCMonth() + UCRETSIZ_DONEM_AY);

  // Üyelik paketi: yeni restoranlarda aktivasyondan itibaren, Kurucu Restoranlarda ücretsiz dönem
  // bittikten sonra zorunlu. Paket/ücret restoran başına admin tarafından Ek-1'e girilir.
  const sozlesmeBitis = new Date(aktivasyon);
  sozlesmeBitis.setUTCMonth(sozlesmeBitis.getUTCMonth() + SOZLESME_SURESI_AY);
  const uyelikUcret =
    r.uyelik_aylik_ucret_tl === null || r.uyelik_aylik_ucret_tl === undefined
      ? null
      : Number(r.uyelik_aylik_ucret_tl);

  const aralik = FIYAT_ARALIKLARI.find((f) => f.seviye === seviye)!;

  return {
    restoran: r.ad,
    sozlesme_surumu: SOZLESME_SURUMU,
    kurucu_restoran: r.kurucu_restoran,
    aktivasyon_tarihi: aktivasyon.toISOString(),
    ucretsiz_donem_baslangic: r.kurucu_restoran ? aktivasyon.toISOString() : null,
    ucretsiz_donem_bitis: r.kurucu_restoran ? ucretsizBitis.toISOString() : null,
    hizmet_bedeli_baslangic: ucretsizBitis.toISOString(),
    segment: `S${seviye}`,
    menu_fiyat_araligi: aralik.aralik,
    kisi_basi_hizmet_bedeli_tl: KADEME_TUTARLARI[seviye],
    kdv: "+ KDV",
    sozlesme_baslangic: aktivasyon.toISOString(),
    sozlesme_bitis: sozlesmeBitis.toISOString(),
    uyelik_paketi: r.uyelik_paketi || null,
    uyelik_aylik_ucret_tl: uyelikUcret,
    uyelik_zorunlu_baslangic: ucretsizBitis.toISOString(),
    hesaplasma_donemi: r.hesaplasma_donemi || "Aylık",
    odeme_vadesi_gun: r.odeme_vadesi_gun ?? 10,
    odeme_yontemi: r.odeme_yontemi || "Havale / EFT",
    kurulum_ve_onboarding_bedeli_tl: r.kurucu_restoran ? 0 : KURULUM_BEDELI_TL,
    segment_tablosu: FIYAT_ARALIKLARI.map((f) => ({
      segment: `S${f.seviye}`,
      menu_fiyat_araligi: f.aralik,
      kisi_basi_hizmet_bedeli_tl: KADEME_TUTARLARI[f.seviye as 1 | 2 | 3 | 4],
    })),
  };
}

export type TicariKosullar = NonNullable<ReturnType<typeof ticariKosullariHesapla>>;

/** PDF belgesinin içeriğini kendi adresinden indirip SHA-256 karmasını döner. */
export async function belgeKarmasi(origin: string, url: string): Promise<string | null> {
  try {
    const yanit = await fetch(new URL(url, origin), { cache: "no-store" });
    if (!yanit.ok) return null;
    const veri = Buffer.from(await yanit.arrayBuffer());
    if (veri.length === 0) return null;
    return createHash("sha256").update(veri).digest("hex");
  } catch {
    return null;
  }
}

/** Sözleşme zorunluysa ve restoran güncel sürümü imzalamadıysa API işlemini reddeder. */
export async function sozlesmeEngeli(restoranId: string): Promise<NextResponse | null> {
  if (!sozlesmeZorunluMu()) return null;
  const servis = createServiceRoleClient();
  const data = await gecerliKabulBul(servis, restoranId);
  if (data) return null;
  return NextResponse.json(
    { hata: "Önce hizmet sözleşmesini ve eklerini imzalamalısınız." },
    { status: 403 }
  );
}

/** Sözleşme bitişine 30 günden az kaldıysa true (panelde yenileme uyarısı için). */
export function sozlesmeYakindaBitiyor(bitisIso: string, gun = 30): boolean {
  return new Date(bitisIso).getTime() - Date.now() < gun * 24 * 60 * 60 * 1000;
}
