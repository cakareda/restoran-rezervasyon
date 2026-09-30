import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { restoranYolu } from "@/lib/slug";
import IptalKarti from "./IptalKarti";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type RezervasyonDetay = {
  id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: string;
  restoran_id: string;
  restoranlar: { ad: string; sehir: string; semt: string } | null;
};

export default async function RezervasyonIptal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ degistir?: string }>;
}) {
  const { id } = await params;
  const { degistir } = await searchParams;
  const t = await getTranslations("RezervasyonIptal");
  const locale = await getLocale();
  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = (await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, durum, restoran_id, restoranlar(ad, sehir, semt)")
    .eq("id", id)
    .single()) as { data: RezervasyonDetay | null };

  const restoranAd = rezervasyon?.restoranlar?.ad ?? "Restaurant";
  const restoranHref = rezervasyon?.restoranlar
    ? restoranYolu({
        id: rezervasyon.restoran_id,
        ad: rezervasyon.restoranlar.ad,
        sehir: rezervasyon.restoranlar.sehir,
        semt: rezervasyon.restoranlar.semt,
      })
    : "/";
  const gecmisMi = rezervasyon ? new Date(rezervasyon.tarih_saat) < new Date() : false;
  const aktifMi =
    rezervasyon && rezervasyon.durum !== "iptal_edildi" && rezervasyon.durum !== "reddedildi";

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-extrabold text-foreground">
          {degistir ? t("baslikDegistir") : t("baslikIptal")}
        </h1>

        {!rezervasyon ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            {t("bulunamadi")}
          </p>
        ) : !aktifMi ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            {t("aktifDegil")}
          </p>
        ) : gecmisMi ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            {t("gecmis")}
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="font-bold text-foreground">{restoranAd}</p>
              <p className="mt-1 text-sm text-muted">
                {new Date(rezervasyon.tarih_saat).toLocaleString(locale, {
                  dateStyle: "long",
                  timeStyle: "short",
                  timeZone: "Europe/Istanbul",
                })}{" "}
                · {t("kisiSayisi", { sayi: rezervasyon.kisi_sayisi })}
              </p>
            </div>
            <IptalKarti id={rezervasyon.id} restoranHref={restoranHref} degistir={!!degistir} />
          </>
        )}
      </div>
    </div>
  );
}
