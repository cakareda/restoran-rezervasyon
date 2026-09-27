import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MusteriHesapNav from "@/components/MusteriHesapNav";
import MobilMenu from "@/components/MobilMenu";
import { SITE_SLOGAN } from "@/lib/config";

export default function IsletmeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader
        LinkBileseni={Link}
        anaSayfaHref="/"
        restoranlarHref="/restoranlar"
        restoranlarMetni="Restoranlar"
        nasilCalisirHref="/#nasil-calisir"
        nasilCalisirMetni="Nasıl çalışır?"
        isletmeSahibiyimMetni="Restoran sahibiyim"
        sloganMetni={SITE_SLOGAN}
        musteriNav={<MusteriHesapNav />}
        mobilMenu={<MobilMenu />}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter
        LinkBileseni={Link}
        slogan={SITE_SLOGAN}
        restoranlarHref="/restoranlar"
        restoranlarMetni="Restoranlar"
        nasilCalisirHref="/#nasil-calisir"
        nasilCalisirMetni="Nasıl çalışır?"
        baslikMasadaki="Masadaki"
        baslikRestoranlarIcin="Restoranlar için"
        nedenMasadakiMetni="Neden Masadaki?"
        restoranGirisiMetni="Restoran girişi"
        restoranKayitMetni="Restoranımı ücretsiz kayıt et"
        bizeUlasinMetni="Bize ulaşın:"
      />
    </>
  );
}
