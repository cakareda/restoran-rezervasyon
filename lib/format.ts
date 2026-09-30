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

/** Serbest metin fiyat aralığından (örn. "400-600") kaba bir seviye çıkarır: 1=₺ .. 4=₺₺₺₺ */
export function fiyatSeviyesi(deger: string | null | undefined): 1 | 2 | 3 | 4 | null {
  if (!deger) return null;
  const eslesme = fiyatTemizle(deger).match(/\d+/);
  if (!eslesme) return null;
  const sayi = Number(eslesme[0]);
  if (sayi < 300) return 1;
  if (sayi < 600) return 2;
  if (sayi < 1000) return 3;
  return 4;
}
