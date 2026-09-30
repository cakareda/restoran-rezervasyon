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

export type GunSaati = {
  acilis: string;
  kapanis: string;
  kapali: boolean;
  /** İkinci servis (örn. akşam), varsa öğle/akşam arası kapalı saat dilimi bırakır. */
  aralik2Acilis?: string;
  aralik2Kapanis?: string;
};
export type CalismaSaatleri = Partial<Record<GunKey, GunSaati>>;

export type OzelGun = {
  tarih: string; // YYYY-MM-DD
  kapali: boolean;
  acilis?: string;
  kapanis?: string;
  aciklama?: string;
};

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

export function ozelGunlerYikle(deger: string | null | undefined): OzelGun[] {
  if (!deger) return [];
  try {
    const veri = JSON.parse(deger);
    return Array.isArray(veri) ? veri : [];
  } catch {
    return [];
  }
}

/** Verilen tarih için o günün açılış/kapanış saatini döner. Sırasıyla: önce özel gün/tatil
 *  istisnası, sonra gün bazlı ayar, son olarak restoranın genel açılış/kapanış saatine
 *  düşer (geriye dönük uyumluluk). */
export function gununSaatleri(params: {
  tarih: string;
  calismaSaatleriJson: string | null | undefined;
  varsayilanAcilis: string;
  varsayilanKapanis: string;
  ozelGunlerJson?: string | null;
}): GunSaati {
  const { tarih, calismaSaatleriJson, varsayilanAcilis, varsayilanKapanis, ozelGunlerJson } = params;

  const ozelGun = ozelGunlerYikle(ozelGunlerJson).find((o) => o.tarih === tarih);
  if (ozelGun) {
    if (ozelGun.kapali) return { acilis: "00:00", kapanis: "00:00", kapali: true };
    return {
      acilis: ozelGun.acilis || varsayilanAcilis,
      kapanis: ozelGun.kapanis || varsayilanKapanis,
      kapali: false,
    };
  }

  const yapi = calismaSaatleriYikle(calismaSaatleriJson);
  const gunVerisi = yapi?.[gunAnahtari(tarih)];
  if (!gunVerisi) return { acilis: varsayilanAcilis, kapanis: varsayilanKapanis, kapali: false };
  return gunVerisi;
}
