import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Restoran, Yorum } from "@/lib/types";
import { OLANAK_ETIKETLERI } from "@/lib/types";
import { fiyatGoster, fiyatSeviyesi } from "@/lib/format";
import { slugYap } from "@/lib/slug";
import { dilAlternatifleri, ogLocale } from "@/lib/seo";
import { KonumIkonu, SaatIkonu, TabakIkonu } from "@/components/icons";
import OlanakIkonu from "@/components/OlanakIkonu";
import RezervasyonFormu from "@/components/RezervasyonFormu";

const getRestoranBySlug = cache(async (sehir: string, semt: string, slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("restoranlar").select("*");
  return (
    (data ?? []).find(
      (r: Restoran) =>
        slugYap(r.sehir) === sehir && slugYap(r.semt) === semt && slugYap(r.ad) === slug
    ) ?? null
  );
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sehir: string; semt: string; slug: string; locale: string }>;
}): Promise<Metadata> {
  const { sehir, semt, slug, locale } = await params;
  const restoran = await getRestoranBySlug(sehir, semt, slug);
  const t = await getTranslations({ locale, namespace: "RestoranDetay" });

  if (!restoran) return { title: t("restoranBulunamadi") };

  const baslik = `${restoran.ad} — ${restoran.semt}, ${restoran.sehir}`;
  const aciklama =
    restoran.aciklama?.trim().slice(0, 155) ||
    `${restoran.ad}, ${restoran.semt}, ${restoran.sehir} adresinde ${restoran.mutfak_turu} mutfağı sunuyor. Masadaki üzerinden ücretsiz rezervasyon talebi gönder.`;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";
  const foto = restoran.fotograflar?.[0] || `${SITE_URL}/opengraph-image`;

  return {
    title: baslik,
    description: aciklama,
    alternates: dilAlternatifleri(`/${sehir}/${semt}/${slug}`, locale),
    openGraph: {
      title: baslik,
      description: aciklama,
      locale: ogLocale(locale),
      images: foto ? [{ url: foto }] : undefined,
    },
  };
}

export default async function RestoranDetay({
  params,
}: {
  params: Promise<{ sehir: string; semt: string; slug: string }>;
}) {
  const { sehir, semt, slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("RestoranDetay");
  const tOlanak = await getTranslations("Olanaklar");

  const restoran = await getRestoranBySlug(sehir, semt, slug);

  if (!restoran) notFound();

  const { data: yorumlar } = await supabase
    .from("yorumlar")
    .select("*")
    .eq("restoran_id", restoran.id)
    .order("olusturulma", { ascending: false });

  const ortalamaPuan =
    yorumlar && yorumlar.length > 0
      ? (
          yorumlar.reduce(
            (toplam: number, y: Yorum) =>
              toplam + (y.puan_yemek + y.puan_servis + y.puan_ortam) / 3,
            0
          ) / yorumlar.length
        ).toFixed(1)
      : null;

  const fotograflar = restoran.fotograflar ?? [];
  const secilenOlanaklar = OLANAK_ETIKETLERI.filter((o) =>
    restoran.olanaklar?.includes(o.deger)
  );
  const bilinenDegerler = OLANAK_ETIKETLERI.map((o) => o.deger) as string[];
  const ozelOlanaklar = ((restoran.olanaklar ?? []) as string[]).filter(
    (o: string) => !bilinenDegerler.includes(o)
  );
  const haritaAdresi = restoran.adres || `${restoran.ad}, ${restoran.semt}, ${restoran.sehir}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";

  const yapilandirilmisVeri = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restoran.ad,
    url: `${siteUrl}/${sehir}/${semt}/${slug}`,
    image: fotograflar.length > 0 ? fotograflar : undefined,
    servesCuisine: restoran.mutfak_turu || undefined,
    priceRange: fiyatGoster(restoran.ortalama_fiyat) || undefined,
    telephone: restoran.telefon || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: restoran.adres || undefined,
      addressLocality: restoran.semt || undefined,
      addressRegion: restoran.sehir || undefined,
      addressCountry: "TR",
    },
    ...(ortalamaPuan
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ortalamaPuan,
            reviewCount: yorumlar?.length ?? 0,
            bestRating: "5",
          },
        }
      : {}),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapilandirilmisVeri) }}
      />
      {fotograflar.length > 0 ? (
        <div className="grid h-48 grid-cols-4 grid-rows-1 gap-1 sm:h-64">
          <img
            src={fotograflar[0]}
            alt={restoran.ad}
            className="col-span-4 h-full min-h-0 w-full object-cover sm:col-span-3"
          />
          <div className="hidden min-h-0 grid-rows-2 gap-1 sm:grid">
            {fotograflar.slice(1, 3).map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="h-full min-h-0 w-full object-cover" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-brand-light sm:h-64">
          <TabakIkonu className="h-16 w-16 text-brand/40" />
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-10">
        {restoran.duyuru && (
          <div className="mb-5 rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand-dark">
            🎉 {restoran.duyuru}
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {restoran.ad}
            </h1>
            <p className="mt-1 text-muted">
              {restoran.semt}, {restoran.sehir} · {restoran.mutfak_turu}
            </p>
          </div>
          {ortalamaPuan && (
            <div className="rounded-2xl bg-brand-light px-4 py-2 text-center">
              <p className="text-lg font-bold text-brand-dark">★ {ortalamaPuan}</p>
              <p className="text-xs text-muted">{t("yorumAdet", { sayi: yorumlar!.length })}</p>
            </div>
          )}
        </div>

        {restoran.aciklama && (
          <p className="mt-5 max-w-2xl text-foreground/80">{restoran.aciklama}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {fiyatGoster(restoran.ortalama_fiyat) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark">
              {fiyatGoster(restoran.ortalama_fiyat)}
              {fiyatSeviyesi(restoran.ortalama_fiyat) && (
                <span aria-hidden className="text-xs">
                  <span>{"₺".repeat(fiyatSeviyesi(restoran.ortalama_fiyat)!)}</span>
                  <span className="text-brand-dark/30">
                    {"₺".repeat(4 - fiyatSeviyesi(restoran.ortalama_fiyat)!)}
                  </span>
                </span>
              )}
            </span>
          )}
          {secilenOlanaklar.map((o) => (
            <span
              key={o.deger}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-foreground"
            >
              <OlanakIkonu deger={o.deger} className="h-3.5 w-3.5 text-muted" />
              {tOlanak(o.deger)}
            </span>
          ))}
          {ozelOlanaklar.map((o) => (
            <span
              key={o}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-foreground"
            >
              {o}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-foreground">
          {restoran.adres && (
            <p className="flex items-center gap-2">
              <KonumIkonu className="h-4 w-4 text-brand" /> <span>{restoran.adres}</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <SaatIkonu className="h-4 w-4 text-brand" />{" "}
            <span>
              {t("herGunSaat", {
                acilis: restoran.acilis_saati.slice(0, 5),
                kapanis: restoran.kapanis_saati.slice(0, 5),
              })}
            </span>
          </p>
        </div>

        {(restoran.instagram_url || restoran.menu_url) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {restoran.instagram_url && (
              <a
                href={restoran.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-brand-light"
              >
                Instagram
              </a>
            )}
            {restoran.menu_url && (
              <a
                href={restoran.menu_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-brand-light"
              >
                Menü
              </a>
            )}
          </div>
        )}

        {restoran.iptal_politikasi && (
          <p className="mt-4 max-w-2xl rounded-xl bg-zinc-50 p-3 text-sm text-muted">
            {restoran.iptal_politikasi}
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <RezervasyonFormu
            restoranId={restoran.id}
            acilisSaati={restoran.acilis_saati.slice(0, 5)}
            kapanisSaati={restoran.kapanis_saati.slice(0, 5)}
            calismaSaatleriJson={restoran.calisma_saatleri}
            maksimumKisi={restoran.maksimum_kisi_sayisi}
            enErkenSaat={restoran.en_erken_rezervasyon_saat}
            enGecGun={restoran.en_gec_rezervasyon_gun}
          />

          <div className="space-y-10">
            {restoran.adres && (
              <div>
                <h2 className="text-lg font-bold text-foreground">{t("konumBaslik")}</h2>
                <iframe
                  title={`${restoran.ad} konum haritası`}
                  className="mt-3 h-56 w-full rounded-2xl border border-border"
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(haritaAdresi)}&output=embed`}
                />
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-foreground">{t("yorumlarBaslik")}</h2>
              <div className="mt-4 space-y-3">
                {yorumlar && yorumlar.length > 0 ? (
                  yorumlar.map((yorum: Yorum) => (
                    <div key={yorum.id} className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-semibold text-brand-dark">
                        ★ {t("yemekEtiket")} {yorum.puan_yemek} · {t("servisEtiket")}{" "}
                        {yorum.puan_servis} · {t("ortamEtiket")} {yorum.puan_ortam}
                      </p>
                      {yorum.yorum_metni && (
                        <p className="mt-2 text-sm text-foreground/80">{yorum.yorum_metni}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
                    {t("henuzYorumYok")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
