import type { Metadata } from "next";
import RestoranKayitClient from "./RestoranKayitClient";

const BASLIK = "Restoranını Ekle";
const ACIKLAMA =
  "Restoranın için ücretsiz Masadaki hesabı oluştur, Google'da arayarak profilini saniyeler içinde doldur.";

export const metadata: Metadata = {
  title: BASLIK,
  description: ACIKLAMA,
  alternates: { canonical: "https://masadaki.com/restoran-kayit" },
  openGraph: {
    title: `${BASLIK} — Masadaki`,
    description: ACIKLAMA,
    url: "https://masadaki.com/restoran-kayit",
    locale: "tr_TR",
  },
};

export default function RestoranKayit() {
  return <RestoranKayitClient />;
}
