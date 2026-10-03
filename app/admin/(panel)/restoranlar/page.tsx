import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import FiyatSeviyesiSecici from "./FiyatSeviyesiSecici";
import Ek1Formu from "./Ek1Formu";
import { SOZLESME_SURUMU, sozlesmeYakindaBitiyor } from "@/lib/sozlesme";

export const metadata: Metadata = { title: "Restoranlar — Admin" };

const UCRETSIZ_DONEM_AY = 6;
const KURULUM_BEDELI = "2.500 TL + KDV";

export default async function AdminRestoranlar() {
  const supabase = createServiceRoleClient();
  const { data: restoranlar } = await supabase
    .from("restoranlar")
    .select("id, ad, sehir, semt, eposta, telefon, fiyat_seviyesi, olusturulma, kurucu_restoran, aktivasyon_tarihi, uyelik_paketi, uyelik_aylik_ucret_tl, hesaplasma_donemi, odeme_vadesi_gun, odeme_yontemi")
    .order("olusturulma", { ascending: false });

  const { data: kabuller } = await supabase
    .from("sozlesme_kabulleri")
    .select("restoran_id, kabul_no, kabul_zamani, imza_adi, sozlesme_bitis").gt("sozlesme_bitis", new Date().toISOString())
    .eq("sozlesme_surumu", SOZLESME_SURUMU);
  const kabulHaritasi = new Map((kabuller ?? []).map((k) => [k.restoran_id, k]));

  const bitecekler = (restoranlar ?? [])
    .map((r) => ({ r, k: kabulHaritasi.get(r.id) }))
    .filter((x) => x.k && sozlesmeYakindaBitiyor(x.k.sozlesme_bitis, 60))
    .sort((a, b) => a.k!.sozlesme_bitis.localeCompare(b.k!.sozlesme_bitis));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Restoranlar</h1>
      <p className="mt-1 text-sm text-muted">
        {restoranlar?.length ?? 0} restoran kayıtlı. Fiyat seviyesi (komisyon kademesi) yalnızca
        buradan değiştirilebilir — restoran paneli üzerinden değiştirilemez.
      </p>

      {bitecekler.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Sözleşmesi 60 gün içinde dolacaklar (yenileme zamanı)</p>
          <ul className="mt-1 space-y-0.5">
            {bitecekler.map(({ r, k }) => (
              <li key={r.id}>
                {r.ad} — {new Date(k!.sozlesme_bitis).toLocaleDateString("tr-TR")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50 text-left text-xs font-semibold uppercase text-muted">
              <th className="px-4 py-2.5">Restoran</th>
              <th className="px-4 py-2.5">İletişim</th>
              <th className="px-4 py-2.5">Kayıt / Ücretsiz dönem bitişi</th>
              <th className="px-4 py-2.5">Fiyat seviyesi</th>
              <th className="px-4 py-2.5">Ek-1</th>
              <th className="px-4 py-2.5">Sözleşme ({SOZLESME_SURUMU})</th>
            </tr>
          </thead>
          <tbody>
            {(restoranlar ?? []).map((r) => {
              const ucretsizBitis = new Date(r.aktivasyon_tarihi);
              if (r.kurucu_restoran) ucretsizBitis.setUTCMonth(ucretsizBitis.getUTCMonth() + UCRETSIZ_DONEM_AY);
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-foreground">{r.ad}</p>
                    <p className="text-xs text-muted">
                      {r.semt}, {r.sehir}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    <p>{r.eposta}</p>
                    <p>{r.telefon}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    <p>Aktivasyon: {new Date(r.aktivasyon_tarihi).toLocaleDateString("tr-TR")}</p>
                    <p>
                      {r.kurucu_restoran
                        ? `★ Kurucu · ücretsiz bitiş: ${ucretsizBitis.toLocaleDateString("tr-TR")}`
                        : `Kurucu değil · ücretsiz dönem yok · kurulum: ${KURULUM_BEDELI}`}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <FiyatSeviyesiSecici restoranId={r.id} mevcutSeviye={r.fiyat_seviyesi} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Ek1Formu
                      restoranId={r.id}
                      baslangic={{
                        uyelikPaketi: r.uyelik_paketi ?? "",
                        uyelikAylikUcretTl: r.uyelik_aylik_ucret_tl === null ? "" : String(r.uyelik_aylik_ucret_tl),
                        hesaplasmaDonemi: r.hesaplasma_donemi,
                        odemeVadesiGun: r.odeme_vadesi_gun,
                        odemeYontemi: r.odeme_yontemi,
                      }}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {kabulHaritasi.get(r.id) ? (
                      <div className="text-green-700">
                        <p className="font-semibold">✓ İmzalandı</p>
                        <p>{kabulHaritasi.get(r.id)!.imza_adi}</p>
                        <p className="text-muted">
                          {kabulHaritasi.get(r.id)!.kabul_no} ·{" "}
                          {new Date(kabulHaritasi.get(r.id)!.kabul_zamani).toLocaleDateString("tr-TR")}
                          {" → "}
                          {new Date(kabulHaritasi.get(r.id)!.sozlesme_bitis).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    ) : (
                      <span className="font-semibold text-amber-700">İmza bekliyor</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(restoranlar ?? []).length === 0 && (
          <p className="p-8 text-center text-sm text-muted">Henüz restoran yok.</p>
        )}
      </div>
    </div>
  );
}
