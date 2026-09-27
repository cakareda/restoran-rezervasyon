export type RezervasyonDurum = "beklemede" | "onaylandi" | "reddedildi";

export interface Restoran {
  id: string;
  auth_user_id: string | null;
  ad: string;
  sehir: string;
  semt: string;
  mutfak_turu: string;
  eposta: string;
  telefon: string | null;
  kapasite: number | null;
  ortalama_fiyat: string | null;
  aciklama: string | null;
  fotograf_url: string | null;
  adres: string | null;
  calisma_saatleri: string | null;
  acilis_saati: string;
  kapanis_saati: string;
  olanaklar: string[];
  fotograflar: string[];
  olusturulma: string;
}

export interface Kullanici {
  id: string;
  auth_user_id: string | null;
  ad_soyad: string;
  eposta: string;
  telefon: string | null;
  olusturulma: string;
}

export const OLANAK_ETIKETLERI = [
  { deger: "wifi", etiket: "Wi-Fi" },
  { deger: "teras", etiket: "Teras" },
  { deger: "evcil_hayvan", etiket: "Evcil hayvan dostu" },
  { deger: "otopark", etiket: "Otopark" },
  { deger: "kredi_karti", etiket: "Kredi kartı" },
  { deger: "canli_muzik", etiket: "Canlı müzik" },
] as const;

export type RezervasyonKaynagi = "online" | "telefon";

export interface Rezervasyon {
  id: string;
  restoran_id: string;
  kullanici_id: string | null;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: RezervasyonDurum;
  geldi_mi: boolean | null;
  kaynak: RezervasyonKaynagi;
  olusturulma: string;
}

export interface Bildirim {
  id: string;
  rezervasyon_id: string;
  kanal: string;
  tur: string;
  gonderilme: string;
}

export interface Yorum {
  id: string;
  rezervasyon_id: string;
  restoran_id: string;
  puan_yemek: number;
  puan_servis: number;
  puan_ortam: number;
  yorum_metni: string | null;
  olusturulma: string;
}
