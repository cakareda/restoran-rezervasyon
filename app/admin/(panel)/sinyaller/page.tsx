import type { Metadata } from "next";
import { restoranSinyalleriHesapla } from "@/lib/restoranSinyalleri";

export const metadata: Metadata = { title: "Restoran Sinyalleri — Admin" };

const GUN_SECENEKLERI = [30, 90, 365];

function yuzde(deger: number | null) {
  return deger === null ? "—" : `%${Math.round(deger * 100)}`;
}

export default async function AdminSinyaller({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string }>;
}) {
  const { gun: gunParam } = await searchParams;
  const gun = GUN_SECENEKLERI.includes(Number(gunParam)) ? Number(gunParam) : 90;

  let sonuc;
  let hata: string | null = null;
  try {
    sonuc = await restoranSinyalleriHesapla(gun);
  } catch {
    hata = "Sinyaller hesaplanamadı.";
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Restoran sinyalleri</h1>
      <p className="mt-1 text-sm text-muted">
        Masadaki kaynaklı rezervasyonlarda komisyondan kaçınma / kötüye kullanım işaretleri. En az 5
        rezervasyonluk örnekten sonra sinyal üretilir. Sinyal bir kanıt değil, incelenecek yerin
        göstergesidir.
      </p>

      <div className="mt-4 flex gap-1.5">
        {GUN_SECENEKLERI.map((g) => (
          <a
            key={g}
            href={`?gun=${g}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              g === gun ? "bg-foreground text-white" : "bg-zinc-100 text-muted hover:bg-zinc-200"
            }`}
          >
            Son {g} gün
          </a>
        ))}
      </div>

      {hata || !sonuc ? (
        <p className="mt-6 text-sm text-red-600">{hata}</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Rezervasyon", String(sonuc.platform.toplam)],
              ["Platform No-Show oranı", yuzde(sonuc.platform.noShowOrani)],
              ["Restoran iptali", String(sonuc.platform.restoranIptal)],
              ["Misafir uyuşmazlığı", String(sonuc.platform.uyusmazlik)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-zinc-50 text-left text-xs font-semibold uppercase text-muted">
                  <th className="px-4 py-2.5">Restoran</th>
                  <th className="px-4 py-2.5 text-right">Rez.</th>
                  <th className="px-4 py-2.5 text-right">Geldi</th>
                  <th className="px-4 py-2.5 text-right">No-Show</th>
                  <th className="px-4 py-2.5 text-right">Rest. iptal</th>
                  <th className="px-4 py-2.5 text-right">Yanıtsız</th>
                  <th className="px-4 py-2.5 text-right">Uyuşmazlık</th>
                  <th className="px-4 py-2.5">Sinyaller</th>
                </tr>
              </thead>
              <tbody>
                {sonuc.restoranlar.map((r) => (
                  <tr key={r.restoranId} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.restoranAd}</td>
                    <td className="px-4 py-2.5 text-right">{r.toplam}</td>
                    <td className="px-4 py-2.5 text-right">{r.geldi}</td>
                    <td className="px-4 py-2.5 text-right">
                      {r.noShow} <span className="text-xs text-muted">({yuzde(r.noShowOrani)})</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.restoranIptal}{" "}
                      <span className="text-xs text-muted">({yuzde(r.restoranIptalOrani)})</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.yanitsiz} <span className="text-xs text-muted">({yuzde(r.yanitsizOrani)})</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.uyusmazlik}
                      {r.misafirUyarisi > 0 && (
                        <span className="block text-xs text-amber-700">+{r.misafirUyarisi} uyarı</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.sinyaller.length === 0 ? (
                        <span className="text-xs text-muted">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {r.sinyaller.map((s) => (
                            <span
                              key={s.kod}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                s.agirlik >= 3 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {s.etiket}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Uyuşmazlık: restoran &quot;Gelmedi/iptal&quot; dedi, misafir &quot;gittim&quot; dedi. Uyarı:
            restoran &quot;Geldi&quot; dedi, misafir &quot;gitmedim&quot; dedi. Yanıtsız: saati geçmiş ama
            onaylanmamış/reddedilmemiş talepler.
          </p>
        </>
      )}
    </div>
  );
}
