import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Restoran, Yorum } from "@/lib/types";

type YorumRestoranli = Yorum & { restoranlar: { ad: string } | null };
import { restoranBazindaPuanla } from "@/lib/puanlama";
import RestoranKarti from "@/components/RestoranKarti";
import HeroArama from "@/components/HeroArama";
import { EpostaIkonu, OnayIkonu, TabakIkonu, AramaIkonu, GonderIkonu } from "@/components/icons";

const HERO_FOTO =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80";
const SEMT_FOTO_YEDEK =
  "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80";

export default async function AnaSayfa() {
  const t = await getTranslations("Anasayfa");
  const supabase = await createClient();

  const [{ data: restoranlar }, { data: yorumlar }] = await Promise.all([
    supabase.from("restoranlar").select("*"),
    supabase
      .from("yorumlar")
      .select("*, restoranlar(ad)")
      .order("olusturulma", { ascending: false }),
  ]);

  const tumRestoranlar = restoranlar ?? [];
  const puanlar = restoranBazindaPuanla(yorumlar ?? []);

  const oneCikanlar = [...tumRestoranlar]
    .sort((a, b) => (puanlar.get(b.id)?.ortalama ?? 0) - (puanlar.get(a.id)?.ortalama ?? 0))
    .slice(0, 3);

  const semtHaritasi = new Map<string, { sayi: number; foto: string | null; sehir: string }>();
  for (const r of tumRestoranlar) {
    const mevcut = semtHaritasi.get(r.semt) ?? { sayi: 0, foto: null, sehir: r.sehir };
    semtHaritasi.set(r.semt, {
      sayi: mevcut.sayi + 1,
      foto: mevcut.foto ?? r.fotograflar?.[0] ?? null,
      sehir: r.sehir,
    });
  }
  const semtler = Array.from(semtHaritasi.entries()).slice(0, 4);

  const gercekYorumlar = ((yorumlar as YorumRestoranli[] | null) ?? [])
    .filter((y) => y.yorum_metni)
    .slice(0, 2);

  const adimlar = [
    { no: "01", Ikon: AramaIkonu, baslik: t("adim1Baslik"), aciklama: t("adim1Aciklama") },
    { no: "02", Ikon: GonderIkonu, baslik: t("adim2Baslik"), aciklama: t("adim2Aciklama") },
    { no: "03", Ikon: OnayIkonu, baslik: t("adim3Baslik"), aciklama: t("adim3Aciklama") },
  ];

  return (
    <div>
      {/* Hero */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(20,8,10,0.55), rgba(20,8,10,0.25)), url(${HERO_FOTO})` }}
      >
        <HeroArama semtler={semtler} />
      </section>

      {/* Güven şeridi */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 text-center sm:grid-cols-3">
          <div>
            <TabakIkonu className="mx-auto h-6 w-6 text-brand" />
            <p className="mt-2 text-sm font-semibold text-foreground">{t("restoranaDogrudanBaslik")}</p>
            <p className="text-xs text-muted">{t("restoranaDogrudanAciklama")}</p>
          </div>
          <div>
            <EpostaIkonu className="mx-auto h-6 w-6 text-brand" />
            <p className="mt-2 text-sm font-semibold text-foreground">{t("epostaBaslik")}</p>
            <p className="text-xs text-muted">{t("epostaAciklama")}</p>
          </div>
          <div>
            <OnayIkonu className="mx-auto h-6 w-6 text-brand" />
            <p className="mt-2 text-sm font-semibold text-foreground">{t("dogrulanmisBaslik")}</p>
            <p className="text-xs text-muted">{t("dogrulanmisAciklama")}</p>
          </div>
        </div>
      </section>

      {/* Öne çıkanlar */}
      {oneCikanlar.length > 0 && (
        <section id="one-cikanlar" className="mx-auto max-w-5xl px-6 py-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">{t("onerilenlerEtiket")}</p>
              <h2 className="mt-1 text-2xl font-extrabold text-foreground">{t("oneCikanBaslik")}</h2>
            </div>
            <Link href="/restoranlar" className="text-sm font-semibold text-brand hover:underline">
              {t("tumRestoranlarLink")}
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {oneCikanlar.map((restoran: Restoran) => {
              const puan = puanlar.get(restoran.id);
              return (
                <RestoranKarti
                  key={restoran.id}
                  restoran={restoran}
                  ortalamaPuan={puan?.ortalama ?? null}
                  yorumSayisi={puan?.sayi ?? 0}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Semtler */}
      {semtler.length > 0 && (
        <section className="bg-brand-light py-14">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">{t("semtSemtEtiket")}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-foreground">{t("semtBaslik")}</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {semtler.map(([semt, bilgi]) => (
                <Link
                  key={semt}
                  href={`/restoranlar?semt=${encodeURIComponent(semt)}`}
                  className="group relative h-40 overflow-hidden rounded-2xl"
                >
                  <img
                    src={bilgi.foto ?? SEMT_FOTO_YEDEK}
                    alt={semt}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-bold">{semt}</p>
                    <p className="text-xs text-white/80">
                      {t("mekanSayisi", { sayi: bilgi.sayi, sehir: bilgi.sehir })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nasıl çalışır */}
      <section id="nasil-calisir" className="mx-auto max-w-5xl px-6 py-14 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">{t("nasilCalisirEtiket")}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-foreground">{t("nasilCalisirBaslik")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("nasilCalisirAciklama")}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {adimlar.map((adim) => (
            <div key={adim.no} className="rounded-2xl border border-border bg-white p-6 text-left">
              <p className="text-xs font-bold text-muted">{adim.no}</p>
              <adim.Ikon className="mt-2 h-6 w-6 text-brand" />
              <p className="mt-2 font-bold text-foreground">{adim.baslik}</p>
              <p className="mt-1 text-sm text-muted">{adim.aciklama}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doğrulanmış yorum sistemi */}
      <section className="bg-brand-darkest py-14 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">
              {t("yorumSistemiEtiket")}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{t("yorumSistemiBaslik")}</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              <li className="flex gap-2">
                <span>✓</span> {t("yorumMadde1")}
              </li>
              <li className="flex gap-2">
                <span>✓</span> {t("yorumMadde2")}
              </li>
              <li className="flex gap-2">
                <span>✓</span> {t("yorumMadde3")}
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/70">{t("sonDeneyimler")}</p>
            {gercekYorumlar.length > 0 ? (
              gercekYorumlar.map((yorum) => (
                <div key={yorum.id} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">
                    ★ {((yorum.puan_yemek + yorum.puan_servis + yorum.puan_ortam) / 3).toFixed(1)}{" "}
                    <span className="font-normal text-white/60">
                      · {yorum.restoranlar?.ad}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-white/80">&ldquo;{yorum.yorum_metni}&rdquo;</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white/10 p-6 text-center text-sm text-white/70 backdrop-blur">
                {t("henuzYorumYok")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kapanış CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t("kapanisBaslik")}</h2>
        <Link
          href="/restoranlar"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("restoranBulBtn")}
        </Link>
      </section>
    </div>
  );
}
