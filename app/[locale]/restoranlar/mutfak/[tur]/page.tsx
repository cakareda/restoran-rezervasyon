import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Restoran } from "@/lib/types";
import { restoranBazindaPuanla } from "@/lib/puanlama";
import { dilAlternatifleri, ogLocale } from "@/lib/seo";
import { slugYap } from "@/lib/slug";
import { Link } from "@/i18n/navigation";
import RestoranKarti from "@/components/RestoranKarti";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tur: string; locale: string }>;
}): Promise<Metadata> {
  const { tur, locale } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("restoranlar").select("mutfak_turu");
  const eslesen = (data ?? []).find((r) => slugYap(r.mutfak_turu) === tur);
  const turAd = eslesen?.mutfak_turu ?? tur;

  const baslik = `${turAd} Restoranları — Masadaki`;
  const aciklama = `En iyi ${turAd} restoranlarını keşfet, anında online rezervasyon yap.`;

  return {
    title: baslik,
    description: aciklama,
    alternates: dilAlternatifleri(`/restoranlar/mutfak/${tur}`, locale),
    openGraph: { title: baslik, description: aciklama, locale: ogLocale(locale) },
  };
}

export default async function MutfakSayfasi({ params }: { params: Promise<{ tur: string }> }) {
  const { tur } = await params;
  const t = await getTranslations("RestoranlarSayfasi");
  const supabase = await createClient();

  const [{ data: tumRestoranlar }, { data: yorumlar }] = await Promise.all([
    supabase.from("restoranlar").select("*").order("ad"),
    supabase.from("yorumlar").select("restoran_id, puan_yemek, puan_servis, puan_ortam"),
  ]);

  const restoranlar = (tumRestoranlar ?? []).filter(
    (r: Restoran) => slugYap(r.mutfak_turu) === tur
  );
  const puanlar = restoranBazindaPuanla(yorumlar ?? []);
  const turAd = restoranlar[0]?.mutfak_turu ?? tur;

  return (
    <div>
      <section className="border-b border-border bg-brand-light">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {turAd} Restoranları
          </h1>
          <p className="mt-2 text-sm text-muted">
            En iyi {turAd} restoranlarını keşfet, anında online rezervasyon yap.
          </p>
          <Link
            href="/restoranlar"
            className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Tüm restoranları gör →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restoranlar.length > 0 ? (
            restoranlar.map((restoran: Restoran) => {
              const puan = puanlar.get(restoran.id);
              return (
                <RestoranKarti
                  key={restoran.id}
                  restoran={restoran}
                  ortalamaPuan={puan?.ortalama ?? null}
                  yorumSayisi={puan?.sayi ?? 0}
                />
              );
            })
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-border py-16 text-center text-muted">
              {t("bulunamadi")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
