import type { Yorum } from "@/lib/types";

export function ortalamaPuanHesapla(yorumlar: Pick<Yorum, "puan_yemek" | "puan_servis" | "puan_ortam">[]) {
  if (yorumlar.length === 0) return null;
  const toplam = yorumlar.reduce(
    (acc, y) => acc + (y.puan_yemek + y.puan_servis + y.puan_ortam) / 3,
    0
  );
  return Number((toplam / yorumlar.length).toFixed(1));
}

export function restoranBazindaPuanla(yorumlar: Pick<Yorum, "restoran_id" | "puan_yemek" | "puan_servis" | "puan_ortam">[]) {
  const gruplar = new Map<string, typeof yorumlar>();
  for (const yorum of yorumlar) {
    const liste = gruplar.get(yorum.restoran_id) ?? [];
    liste.push(yorum);
    gruplar.set(yorum.restoran_id, liste);
  }

  const sonuc = new Map<string, { ortalama: number; sayi: number }>();
  for (const [restoranId, liste] of gruplar) {
    sonuc.set(restoranId, { ortalama: ortalamaPuanHesapla(liste)!, sayi: liste.length });
  }
  return sonuc;
}
