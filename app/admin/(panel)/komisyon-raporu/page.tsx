import type { Metadata } from "next";
import { komisyonRaporuHesapla } from "@/lib/komisyonRaporu";

export const metadata: Metadata = { title: "Komisyon Raporu — Admin" };

export default async function AdminKomisyonRaporu({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const simdi = new Date();
  const varsayilanAy = `${simdi.getUTCFullYear()}-${String(simdi.getUTCMonth() + 1).padStart(2, "0")}`;
  const secilenAy = ay || varsayilanAy;

  let sonuc;
  let hata: string | null = null;
  try {
    sonuc = await komisyonRaporuHesapla(secilenAy);
  } catch {
    hata = "Rapor hesaplanamadı.";
  }

  const genelToplam = sonuc?.satirlar.reduce((t, s) => t + s.toplamTutar, 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Komisyon Raporu</h1>
      <p className="mt-1 text-sm text-muted">
        Tahakkuk esaslı: misafir "evet" dediğinde, "hayır" dediğinde veya 48 saat yanıt vermeyip
        sessizlikle kesinleştiğinde sayılır — rezervasyon tarihi değil, kesinleşme tarihi esas
        alınır. KDV içermez.
      </p>

      <form method="get" className="mt-4 flex items-center gap-2">
        <input
          type="month"
          name="ay"
          defaultValue={secilenAy}
          className="rounded-lg border-0 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Göster
        </button>
      </form>

      {hata ? (
        <p className="mt-6 text-sm text-red-600">{hata}</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-zinc-50 text-left text-xs font-semibold uppercase text-muted">
                  <th className="px-4 py-2.5">Restoran</th>
                  <th className="px-4 py-2.5">E-posta</th>
                  <th className="px-4 py-2.5">Ücretsiz dönem bitişi</th>
                  <th className="px-4 py-2.5 text-right">Kesinleşmiş gelen misafir</th>
                  <th className="px-4 py-2.5 text-right">İtirazlı (hariç)</th>
                  <th className="px-4 py-2.5 text-right">Tutar (TL)</th>
                </tr>
              </thead>
              <tbody>
                {sonuc!.satirlar.map((s) => (
                  <tr key={s.restoranId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.restoranAd}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{s.restoranEposta}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">
                      {new Date(s.ucretsizDonemBitisi).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right">{s.kesinlesmisMisafirSayisi}</td>
                    <td
                      className={`px-4 py-2.5 text-right ${s.itirazliSayisi > 0 ? "font-semibold text-red-600" : ""}`}
                    >
                      {s.itirazliSayisi}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${s.toplamTutar === 0 ? "text-muted" : "font-semibold"}`}>
                      {s.toplamTutar.toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50">
                  <th colSpan={5} className="px-4 py-2.5 text-left">
                    Genel toplam
                  </th>
                  <th className="px-4 py-2.5 text-right">{genelToplam.toLocaleString("tr-TR")} TL</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            {sonuc!.bekleyenToplam} rezervasyon henüz 48 saatlik itiraz penceresini doldurmadı,
            kesinleştiği ayın raporunda otomatik görünecek.
          </p>
        </>
      )}
    </div>
  );
}
