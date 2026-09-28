export type RezervasyonDurum = "beklemede" | "onaylandi" | "reddedildi" | "iptal_edildi";

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
  oturma_suresi_dk: number;
  olanaklar: string[];
  fotograflar: string[];
  instagram_url: string | null;
  menu_url: string | null;
  iptal_politikasi: string | null;
  olusturulma: string;
}

export interface Masa {
  id: string;
  restoran_id: string;
  kapasite: number;
  adet: number;
  alan: string;
}

export const MASA_ALANLARI = [
  { deger: "", etiket: "Genel" },
  { deger: "salon", etiket: "Salon" },
  { deger: "bahce", etiket: "Bahçe" },
  { deger: "teras", etiket: "Teras" },
];

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
  { deger: "alkol", etiket: "Alkol servisi" },
  { deger: "cocuk_sandalyesi", etiket: "Çocuk sandalyesi" },
  { deger: "engelli_erisimi", etiket: "Engelli erişimi" },
  { deger: "vegan_helal", etiket: "Vegan / Helal seçenekler" },
  { deger: "ingilizce_konusan_garson", etiket: "Garson İngilizce konuşuyor" },
] as const;

export const MUTFAK_TURLERI = [
  "Türk",
  "Osmanlı",
  "Ev Yemekleri",
  "Sokak Lezzetleri",
  "Kebap",
  "Deniz Ürünleri",
  "İtalyan",
  "Fransız",
  "Uzak Doğu",
  "Meksika",
  "Hint",
  "Akdeniz",
  "Vejetaryen / Vegan",
  "Kahvaltı",
  "Tatlı & Pastane",
  "Kafe",
  "Diğer",
] as const;

export type RezervasyonKaynagi = "online" | "telefon";

export const OZEL_GUN_SECENEKLERI = [
  { deger: "dogum_gunu", etiket: "Doğum günü" },
  { deger: "yil_donumu", etiket: "Yıl dönümü" },
  { deger: "is_yemegi", etiket: "İş yemeği" },
  { deger: "kutlama", etiket: "Kutlama" },
] as const;

export interface Rezervasyon {
  id: string;
  restoran_id: string;
  kullanici_id: string | null;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: RezervasyonDurum;
  geldi_mi: boolean | null;
  kaynak: RezervasyonKaynagi;
  masa_kapasitesi: number | null;
  ozel_gun: string | null;
  misafir_ad_soyad: string | null;
  misafir_telefon: string | null;
  misafir_dili: string | null;
  olusturulma: string;
}

export interface BeklemeKaydi {
  id: string;
  restoran_id: string;
  ad_soyad: string;
  eposta: string;
  telefon: string | null;
  tarih: string;
  saat: string;
  kisi_sayisi: number;
  durum: "bekliyor" | "iletildi" | "iptal";
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
