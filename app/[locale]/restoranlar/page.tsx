import { getTranslations } from "next-intl/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { ATMOSFER_ETIKETLERI, type Restoran } from "@/lib/types";
import { restoranBazindaPuanla } from "@/lib/puanlama";
import { fiyatSeviyesi } from "@/lib/format";
import { musaitlikHesapla } from "@/lib/kapasite";
import { istanbulTarihSaat, bugununTarihi } from "@/lib/tarih";
import { dilAlternatifleri, ogLocale } from "@/lib/seo";
import RestoranKarti from "@/components/RestoranKarti";
import SaatSecici from "@/components/SaatSecici";
import RestoranHaritasi from "@/components/RestoranHaritasi";
import { TakvimIkonu, KisiIkonu } from "@/components/icons";
import { restoranYolu } from "@/lib/slug";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RestoranlarSayfasi" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: dilAlternatifleri("/restoranlar", locale),
    openGraph: { title: t("title"), description: t("description"), locale: ogLocale(locale) },
  };
}

type AramaParams = {
  sehir?: string;
  semt?: string;
  mutfakTuru?: string;
  ara?: string;
  minPuan?: string;
  fiyatSeviye?: string;
  tarih?: string;
  saat?: string;
  kisi?: string;
  sirala?: string;
  atmosfer?: string | string[];
  gorunum?: string;
};

function gorunumLinki(mevcut: AramaParams, hedefGorunum: string) {
  const params: Record<string, string | string[]> = {};
  for (const [anahtar, deger] of Object.entries(mevcut)) {
    if (deger === undefined || anahtar === "gorunum") continue;
    params[anahtar] = deger;
  }
  params.gorunum = hedefGorunum;
  return params;
}

export default async function RestoranlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<AramaParams>;
}) {
  const t = await getTranslations("RestoranlarSayfasi");
  const searchParamsGirdi = await searchParams;
  const {
    sehir,
    semt,
    mutfakTuru,
    ara,
    minPuan,
    fiyatSeviye,
    tarih,
    saat,
    kisi,
    sirala,
    atmosfer,
    gorunum,
  } = searchParamsGirdi;
  const haritaGorunumu = gorunum === "harita";
  const supabase = await createClient();
  const secilenAtmosferler = atmosfer ? (Array.isArray(atmosfer) ? atmosfer : [atmosfer]) : [];

  let sorgu = supabase.from("restoranlar").select("*").order("ad");

  if (sehir) sorgu = sorgu.ilike("sehir", `%${sehir}%`);
  if (semt) sorgu = sorgu.ilike("semt", `%${semt}%`);
  if (mutfakTuru) sorgu = sorgu.ilike("mutfak_turu", `%${mutfakTuru}%`);
  if (ara) sorgu = sorgu.ilike("ad", `%${ara}%`);
  if (secilenAtmosferler.length > 0) sorgu = sorgu.contains("olanaklar", secilenAtmosferler);

  const [{ data: tumRestoranlar }, { data: yorumlar }, { data: filtreSecenekleriKaynagi }] =
    await Promise.all([
      sorgu,
      supabase.from("yorumlar").select("restoran_id, puan_yemek, puan_servis, puan_ortam"),
      // Filtre dropdown'larının seçenekleri, aktif aramadan/filtreden bağımsız
      // olarak TÜM restoranlardan üretilmeli — yoksa arama sonucu boşaldığında
      // semt/mutfak seçenekleri de kaybolur.
      supabase.from("restoranlar").select("sehir, semt, mutfak_turu"),
    ]);

  const puanlar = restoranBazindaPuanla(yorumlar ?? []);
  const minPuanSayi = minPuan ? Number(minPuan) : 0;
  const fiyatSeviyeSayi = fiyatSeviye ? Number(fiyatSeviye) : null;

  let restoranlar = (tumRestoranlar ?? []).filter((r) => {
    if ((puanlar.get(r.id)?.ortalama ?? 0) < minPuanSayi) return false;
    if (fiyatSeviyeSayi && fiyatSeviyesi(r.ortalama_fiyat) !== fiyatSeviyeSayi) return false;
    return true;
  });

  const musaitlikAktif = Boolean(tarih && saat && kisi);
  if (musaitlikAktif) {
    const kisiSayisi = Number(kisi);
    const istenenBaslangic = istanbulTarihSaat(tarih!, saat!);
    const servisClient = createServiceRoleClient();

    const sonuclar = await Promise.all(
      restoranlar.map(async (r) => {
        const [{ data: masalar }, { data: rezervasyonlar }] = await Promise.all([
          servisClient.from("masalar").select("kapasite, adet").eq("restoran_id", r.id),
          servisClient
            .from("rezervasyonlar")
            .select("tarih_saat, masa_kapasitesi")
            .eq("restoran_id", r.id)
            .in("durum", ["beklemede", "onaylandi"]),
        ]);

        const { musait } = musaitlikHesapla({
          istenenBaslangic,
          kisiSayisi,
          oturmaSuresiDk: r.oturma_suresi_dk ?? 90,
          masalar: masalar ?? [],
          aktifRezervasyonlar: rezervasyonlar ?? [],
        });

        return { restoran: r, musait };
      })
    );

    restoranlar = sonuclar.filter((s) => s.musait).map((s) => s.restoran);
  }

  const siralamaFn: Record<string, (a: Restoran, b: Restoran) => number> = {
    puanYuksek: (a, b) => (puanlar.get(b.id)?.ortalama ?? 0) - (puanlar.get(a.id)?.ortalama ?? 0),
    fiyatDusuk: (a, b) => (fiyatSeviyesi(a.ortalama_fiyat) ?? 99) - (fiyatSeviyesi(b.ortalama_fiyat) ?? 99),
    fiyatYuksek: (a, b) => (fiyatSeviyesi(b.ortalama_fiyat) ?? 0) - (fiyatSeviyesi(a.ortalama_fiyat) ?? 0),
    isimAZ: (a, b) => a.ad.localeCompare(b.ad, "tr"),
  };
  if (sirala && siralamaFn[sirala]) {
    restoranlar = [...restoranlar].sort(siralamaFn[sirala]);
  }

  function harfDuyarsizBenzersiz(degerler: string[]) {
    const gorulen = new Map<string, string>();
    for (const d of degerler) {
      const anahtar = d.toLocaleLowerCase("tr");
      if (!gorulen.has(anahtar)) gorulen.set(anahtar, d);
    }
    return Array.from(gorulen.values()).sort((a, b) => a.localeCompare(b, "tr"));
  }

  const mutfakSecenekleri = harfDuyarsizBenzersiz(
    (filtreSecenekleriKaynagi ?? []).map((r) => r.mutfak_turu).filter(Boolean)
  );
  const semtSecenekleri = harfDuyarsizBenzersiz(
    (filtreSecenekleriKaynagi ?? []).map((r) => r.semt).filter(Boolean)
  );

  const filtreliMi = Boolean(
    sehir || semt || mutfakTuru || ara || minPuan || fiyatSeviye || musaitlikAktif || secilenAtmosferler.length
  );

  return (
    <div>
      <section className="border-b border-border bg-brand-light">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("baslik")}
          </h1>

          <form
            method="get"
            className="mx-auto mt-6 max-w-4xl space-y-2 rounded-2xl bg-white p-3 shadow-lg shadow-black/5"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="ara"
                defaultValue={ara}
                placeholder={t("aramaPlaceholder")}
                className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              />
              <input
                type="text"
                name="sehir"
                defaultValue={sehir}
                placeholder={t("sehirPlaceholder")}
                className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              />
              <select
                name="semt"
                defaultValue={semt ?? ""}
                className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              >
                <option value="">{t("semtTumu")}</option>
                {semtSecenekleri.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                name="mutfakTuru"
                defaultValue={mutfakTuru ?? ""}
                className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              >
                <option value="">{t("mutfakTumu")}</option>
                {mutfakSecenekleri.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5 ring-1 ring-border focus-within:ring-2 focus-within:ring-brand">
                <TakvimIkonu className="h-4 w-4 shrink-0 text-muted" />
                <span className="flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                    {t("tarihEtiket")}
                  </span>
                  <input
                    type="date"
                    name="tarih"
                    defaultValue={tarih || bugununTarihi()}
                    min={bugununTarihi()}
                    className="w-full border-0 p-0 text-sm font-semibold text-foreground outline-none"
                  />
                </span>
              </label>
              <SaatSecici name="saat" defaultValue={saat} etiket={t("saatEtiket")} />
              <label className="flex items-center gap-2 rounded-xl px-4 py-2.5 ring-1 ring-border focus-within:ring-2 focus-within:ring-brand sm:w-28">
                <KisiIkonu className="h-4 w-4 shrink-0 text-muted" />
                <span className="flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                    {t("kisiEtiket")}
                  </span>
                  <input
                    type="number"
                    name="kisi"
                    min={1}
                    defaultValue={kisi}
                    placeholder={t("kisiPlaceholder")}
                    className="w-full border-0 p-0 text-sm font-semibold text-foreground outline-none"
                  />
                </span>
              </label>
              <select
                name="fiyatSeviye"
                defaultValue={fiyatSeviye ?? ""}
                className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              >
                <option value="">{t("fiyatTumu")}</option>
                <option value="1">₺</option>
                <option value="2">₺₺</option>
                <option value="3">₺₺₺</option>
                <option value="4">₺₺₺₺</option>
              </select>
              <select
                name="minPuan"
                defaultValue={minPuan ?? ""}
                className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              >
                <option value="">{t("tumPuanlar")}</option>
                <option value="4.5">4.5+ ★</option>
                <option value="4">4+ ★</option>
                <option value="3">3+ ★</option>
              </select>
              <select
                name="sirala"
                defaultValue={sirala ?? ""}
                className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              >
                <option value="">{t("siralaVarsayilan")}</option>
                <option value="puanYuksek">{t("siralaPuanYuksek")}</option>
                <option value="fiyatDusuk">{t("siralaFiyatDusuk")}</option>
                <option value="fiyatYuksek">{t("siralaFiyatYuksek")}</option>
                <option value="isimAZ">{t("siralaIsimAZ")}</option>
              </select>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark sm:flex-none"
              >
                {t("araBtn")}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {ATMOSFER_ETIKETLERI.map((a) => (
                <label
                  key={a.deger}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:checked]:text-brand-dark"
                >
                  <input
                    type="checkbox"
                    name="atmosfer"
                    value={a.deger}
                    defaultChecked={secilenAtmosferler.includes(a.deger)}
                    className="accent-brand"
                  />
                  {a.etiket}
                </label>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {filtreliMi ? t("aramaSonuclari") : t("tumRestoranlar")}
          </h2>
          <div className="flex gap-1 rounded-full bg-zinc-100 p-1 text-sm font-semibold">
            <Link
              href={{ pathname: "/restoranlar", query: gorunumLinki(searchParamsGirdi, "liste") }}
              className={`rounded-full px-3.5 py-1.5 ${!haritaGorunumu ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
            >
              Liste
            </Link>
            <Link
              href={{ pathname: "/restoranlar", query: gorunumLinki(searchParamsGirdi, "harita") }}
              className={`rounded-full px-3.5 py-1.5 ${haritaGorunumu ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
            >
              Harita
            </Link>
          </div>
        </div>

        {haritaGorunumu ? (
          <div className="mt-6">
            <RestoranHaritasi
              restoranlar={restoranlar
                .filter(
                  (r): r is Restoran & { lat: number; lng: number } =>
                    typeof r.lat === "number" && typeof r.lng === "number"
                )
                .map((r) => ({ id: r.id, ad: r.ad, lat: r.lat, lng: r.lng, href: restoranYolu(r) }))}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restoranlar && restoranlar.length > 0 ? (
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
        )}
      </section>
    </div>
  );
}
