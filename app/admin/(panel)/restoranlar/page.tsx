import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import FiyatSeviyesiSecici from "./FiyatSeviyesiSecici";

export const metadata: Metadata = { title: "Restoranlar — Admin" };

const UCRETSIZ_DONEM_AY = 6;
const KURULUM_BEDELI = "2.500 TL + KDV";

export default async function AdminRestoranlar() {
  const supabase = createServiceRoleClient();
  const { data: restoranlar } = await supabase
    .from("restoranlar")
    .select("id, ad, sehir, semt, eposta, telefon, fiyat_seviyesi, olusturulma, kurucu_restoran, aktivasyon_tarihi")
    .order("olusturulma", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Restoranlar</h1>
      <p className="mt-1 text-sm text-muted">
        {restoranlar?.length ?? 0} restoran kayıtlı. Fiyat seviyesi (komisyon kademesi) yalnızca
        buradan değiştirilebilir — restoran paneli üzerinden değiştirilemez.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50 text-left text-xs font-semibold uppercase text-muted">
              <th className="px-4 py-2.5">Restoran</th>
              <th className="px-4 py-2.5">İletişim</th>
              <th className="px-4 py-2.5">Kayıt / Ücretsiz dönem bitişi</th>
              <th className="px-4 py-2.5">Fiyat seviyesi</th>
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
