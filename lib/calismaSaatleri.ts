export type GunKey =
  | "pazartesi"
  | "sali"
  | "carsamba"
  | "persembe"
  | "cuma"
  | "cumartesi"
  | "pazar";

export const GUNLER: { key: GunKey; etiket: string }[] = [
  { key: "pazartesi", etiket: "Pazartesi" },
  { key: "sali", etiket: "Salı" },
  { key: "carsamba", etiket: "Çarşamba" },
  { key: "persembe", etiket: "Perşembe" },
  { key: "cuma", etiket: "Cuma" },
  { key: "cumartesi", etiket: "Cumartesi" },
  { key: "pazar", etiket: "Pazar" },
];

export type GunSaati = { acilis: string; kapanis: string; kapali: boolean };
export type CalismaSaatleri = Partial<Record<GunKey, GunSaati>>;

const JS_GUN_INDEX_TO_KEY: GunKey[] = [
  "pazar",
  "pazartesi",
  "sali",
  "carsamba",
  "persembe",
  "cuma",
  "cumartesi",
];

export function gunAnahtari(tarihStr: string): GunKey {
  const [y, m, d] = tarihStr.split("-").map(Number);
  const gunIndex = new Date(y, m - 1, d).getDay();
  return JS_GUN_INDEX_TO_KEY[gunIndex];
}

export function calismaSaatleriYikle(deger: string | null | undefined): CalismaSaatleri | null {
  if (!deger) return null;
  try {
    return JSON.parse(deger);
  } catch {
    return null;
  }
}

/** Verilen tarih için o günün açılış/kapanış saatini döner; gün bazlı ayar yoksa restoranın
 *  genel açılış/kapanış saatine düşer (geriye dönük uyumluluk). */
export function gununSaatleri(params: {
  tarih: string;
  calismaSaatleriJson: string | null | undefined;
  varsayilanAcilis: string;
  varsayilanKapanis: string;
}): GunSaati {
  const { tarih, calismaSaatleriJson, varsayilanAcilis, varsayilanKapanis } = params;
  const yapi = calismaSaatleriYikle(calismaSaatleriJson);
  const gunVerisi = yapi?.[gunAnahtari(tarih)];
  if (!gunVerisi) return { acilis: varsayilanAcilis, kapanis: varsayilanKapanis, kapali: false };
  return gunVerisi;
}
