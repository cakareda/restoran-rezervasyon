export type MasaGrubu = { kapasite: number; adet: number };
export type AktifRezervasyon = { tarih_saat: string; masa_kapasitesi: number | null };

/**
 * Belirli bir saatte, belirli bir kişi sayısı için müsait bir masa olup olmadığını
 * hesaplar. Masa envanteri boşsa (restoran henüz tanımlamamışsa) eski davranışa
 * döner: o an çakışan herhangi bir rezervasyon varsa saat tamamen kapalıdır.
 */
export function musaitlikHesapla(params: {
  istenenBaslangic: Date;
  kisiSayisi: number;
  oturmaSuresiDk: number;
  masalar: MasaGrubu[];
  aktifRezervasyonlar: AktifRezervasyon[];
}): { musait: boolean; atanacakKapasite: number | null } {
  const { istenenBaslangic, kisiSayisi, oturmaSuresiDk, masalar, aktifRezervasyonlar } = params;
  const istenenBitis = new Date(istenenBaslangic.getTime() + oturmaSuresiDk * 60000);

  function cakisiyorMu(digerBaslangicIso: string) {
    const digerBaslangic = new Date(digerBaslangicIso);
    const digerBitis = new Date(digerBaslangic.getTime() + oturmaSuresiDk * 60000);
    return digerBaslangic < istenenBitis && digerBitis > istenenBaslangic;
  }

  if (masalar.length === 0) {
    const doluMu = aktifRezervasyonlar.some((r) => cakisiyorMu(r.tarih_saat));
    return { musait: !doluMu, atanacakKapasite: null };
  }

  const kapasiteyeGoreToplam = new Map<number, number>();
  for (const m of masalar) {
    kapasiteyeGoreToplam.set(m.kapasite, (kapasiteyeGoreToplam.get(m.kapasite) ?? 0) + m.adet);
  }

  const uygunTierler = [...kapasiteyeGoreToplam.entries()]
    .map(([kapasite, adet]) => ({ kapasite, adet }))
    .filter((m) => m.kapasite >= kisiSayisi)
    .sort((a, b) => a.kapasite - b.kapasite);

  for (const tier of uygunTierler) {
    const cakisanSayisi = aktifRezervasyonlar.filter(
      (r) => r.masa_kapasitesi === tier.kapasite && cakisiyorMu(r.tarih_saat)
    ).length;

    if (cakisanSayisi < tier.adet) {
      return { musait: true, atanacakKapasite: tier.kapasite };
    }
  }

  return { musait: false, atanacakKapasite: null };
}
