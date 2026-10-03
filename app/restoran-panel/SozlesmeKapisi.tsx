import { createClient } from "@/lib/supabase/server";
import {
  RESTORAN_TICARI_SECIM,
  SOZLESME_BELGELERI,
  SOZLESME_SURUMU,
  ticariKosullariHesapla,
} from "@/lib/sozlesme";
import ImzaFormu from "./ImzaFormu";
import CikisYapButonu from "./CikisYapButonu";

function tarih(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) : "—";
}

// Restoran sözleşmeyi ve eklerini imzalamadan panele erişemez: panel layout'u imza yoksa
// çocuk sayfalar yerine bu bileşeni gösterir.
export default async function SozlesmeKapisi({ restoranId }: { restoranId: string }) {
  const supabase = await createClient();
  const { data: restoran } = await supabase
    .from("restoranlar")
    .select(`adres, eposta, telefon, ${RESTORAN_TICARI_SECIM}`)
    .eq("id", restoranId)
    .single();

  // Aktivasyon imza anında başlar: ilk imzadan önce önizleme "bugün" üzerinden gösterilir.
  const { count: oncekiKabul } = await supabase
    .from("sozlesme_kabulleri")
    .select("id", { count: "exact", head: true })
    .eq("restoran_id", restoranId);
  const yenileme = (oncekiKabul ?? 0) > 0;
  const ticari = restoran
    ? ticariKosullariHesapla(
        yenileme ? restoran : { ...restoran, aktivasyon_tarihi: new Date().toISOString() }
      )
    : null;

  return (
    <div className="min-h-screen bg-[#faf7f4] px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Hizmet sözleşmesi ve ekleri</h1>
            <p className="mt-1 text-sm text-muted">
              Masadaki paneline erişmeden önce sözleşmeyi ve eklerini incelemen ve imzalaman gerekiyor
              (sürüm {SOZLESME_SURUMU}){yenileme ? " — sözleşme süreniz doldu, yenileme gerekiyor" : ""}.
            </p>
          </div>
          <CikisYapButonu />
        </div>

        {!restoran || !ticari ? (
          <p className="mt-6 rounded-2xl border border-border bg-white p-6 text-sm text-muted shadow-sm">
            Ticari koşulların (segment) henüz Masadaki ekibi tarafından tanımlanmamış. Kurulum
            tamamlanınca bu sayfada imza adımı açılacak. Lütfen bizimle iletişime geç:{" "}
            <a href="mailto:info@masadaki.com" className="font-semibold text-brand hover:underline">
              info@masadaki.com
            </a>
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground">Taraflar</h2>
              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Masadaki</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {process.env.MASADAKI_UNVAN || "[Masadaki şirket unvanı]"}
                  </p>
                  <p className="text-muted">info@masadaki.com</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Restoran</p>
                  <p className="mt-1 font-semibold text-foreground">{restoran.ad}</p>
                  <p className="text-muted">{restoran.eposta}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground">Ek-1 — Restorana özel ticari koşullar</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ["Kurucu Restoran", ticari.kurucu_restoran ? "Evet" : "Hayır"],
                  ["Aktivasyon tarihi", yenileme ? tarih(ticari.aktivasyon_tarihi) : "İmza anı (bugün)"],
                  ["Sözleşme süresi", `${tarih(ticari.sozlesme_baslangic)} – ${tarih(ticari.sozlesme_bitis)}`],
                  ["Ücretsiz dönem", ticari.kurucu_restoran ? `${tarih(ticari.ucretsiz_donem_baslangic)} – ${tarih(ticari.ucretsiz_donem_bitis)}` : "Yok"],
                  ["Hizmet bedeli başlangıcı", tarih(ticari.hizmet_bedeli_baslangic)],
                  ["Segment", `${ticari.segment} (menü ortalaması ${ticari.menu_fiyat_araligi} TL)`],
                  ["Kişi başı hizmet bedeli", `${ticari.kisi_basi_hizmet_bedeli_tl} TL ${ticari.kdv}`],
                  [
                    "Üyelik paketi",
                    ticari.uyelik_paketi
                      ? `${ticari.uyelik_paketi}${ticari.uyelik_aylik_ucret_tl !== null ? ` · ${ticari.uyelik_aylik_ucret_tl.toLocaleString("tr-TR")} TL/ay + KDV` : ""} (${tarih(ticari.uyelik_zorunlu_baslangic)} itibarıyla zorunlu)`
                      : `Henüz belirlenmedi (${tarih(ticari.uyelik_zorunlu_baslangic)} itibarıyla zorunlu)`,
                  ],
                  ["Hesaplaşma dönemi", ticari.hesaplasma_donemi],
                  ["Ödeme vadesi", `Fatura tarihinden itibaren ${ticari.odeme_vadesi_gun} gün`],
                  ["Ödeme yöntemi", ticari.odeme_yontemi],
                  [
                    "Kurulum ve onboarding bedeli",
                    ticari.kurulum_ve_onboarding_bedeli_tl === 0
                      ? "0 TL (Kurucu Restoran)"
                      : `${ticari.kurulum_ve_onboarding_bedeli_tl.toLocaleString("tr-TR")} TL ${ticari.kdv}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border py-1.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-semibold text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted">
                Doğrudan (restoranın kendi kanallarından gelen) rezervasyonlar hizmet bedeline tabi değildir.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground">Ek-2 — Segmentasyon ve fiyatlandırma</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="py-1.5">Segment</th>
                    <th>Menü fiyat ortalaması</th>
                    <th className="text-right">Kişi başı bedel</th>
                  </tr>
                </thead>
                <tbody>
                  {ticari.segment_tablosu.map((s) => (
                    <tr
                      key={s.segment}
                      className={`border-b border-border ${s.segment === ticari.segment ? "bg-brand-light font-semibold" : ""}`}
                    >
                      <td className="py-1.5">{s.segment}</td>
                      <td>{s.menu_fiyat_araligi.replace("-", " – ")} TL</td>
                      <td className="text-right">{s.kisi_basi_hizmet_bedeli_tl} TL + KDV</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <ImzaFormu
              belgeler={SOZLESME_BELGELERI.map((b) => ({ kod: b.kod, ad: b.ad, url: b.url }))}
              baslangic={{
                unvan: restoran.ad ?? "",
                adres: restoran.adres ?? "",
                eposta: restoran.eposta ?? "",
                telefon: restoran.telefon ?? "",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
