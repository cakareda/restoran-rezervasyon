export function fiyatTemizle(deger: string) {
  return deger
    .replace(/^\s*(₺|TL)\s*/i, "")
    .replace(/\s*TL\s*$/i, "")
    .replace(/\s*-\s*/g, "–");
}

export function fiyatGoster(deger: string | null | undefined) {
  if (!deger) return null;
  const temiz = fiyatTemizle(deger);
  return temiz ? `₺${temiz}` : null;
}

/**
 * Fiyat seviyesini (1=₺ .. 4=₺₺₺₺) döner. Restoran sahibi seviyeyi elle seçmişse
 * (fiyat_seviyesi) o esas alınır; aksi halde serbest metin ortalama fiyattan
 * (örn. "400-600") kaba bir seviye çıkarılır — eski kayıtlarla geriye dönük uyumluluk için.
 */
export function fiyatSeviyesi(
  deger: string | null | undefined,
  elleSeviye?: number | null
): 1 | 2 | 3 | 4 | null {
  if (elleSeviye && elleSeviye >= 1 && elleSeviye <= 4) return elleSeviye as 1 | 2 | 3 | 4;
  if (!deger) return null;
  const eslesme = fiyatTemizle(deger).match(/\d+/);
  if (!eslesme) return null;
  const sayi = Number(eslesme[0]);
  if (sayi < 300) return 1;
  if (sayi < 600) return 2;
  if (sayi < 1000) return 3;
  return 4;
}

/** Telefon numarasını wa.me formatına (ülke kodlu, sadece rakam) çevirir. */
export function whatsappNumarasi(telefon: string) {
  // Yeni kayıtlarda ülke kodu zaten "+" ile geliyor (örn. "+905551234567").
  if (telefon.startsWith("+")) return telefon.slice(1).replace(/\D/g, "");
  // Eski kayıtlar (ülke kodu olmadan girilmiş, Türk numarası varsayımı).
  const rakamlar = telefon.replace(/\D/g, "");
  if (rakamlar.startsWith("90")) return rakamlar;
  if (rakamlar.startsWith("0")) return `90${rakamlar.slice(1)}`;
  return `90${rakamlar}`;
}
