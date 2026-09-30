import type { Metadata } from "next";
import RestoranGirisiClient from "./RestoranGirisiClient";

const BASLIK = "Restoran Girişi";
const ACIKLAMA = "Rezervasyon taleplerinizi yönetmek için Masadaki restoran paneline giriş yapın.";

export const metadata: Metadata = {
  title: BASLIK,
  description: ACIKLAMA,
  alternates: { canonical: "https://masadaki.com/restoran-girisi" },
  openGraph: {
    title: `${BASLIK} — Masadaki`,
    description: ACIKLAMA,
    url: "https://masadaki.com/restoran-girisi",
    locale: "tr_TR",
  },
};

export default function RestoranGirisi() {
  return <RestoranGirisiClient />;
}
