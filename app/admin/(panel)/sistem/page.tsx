import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sistem — Admin" };
export const dynamic = "force-dynamic";

const CRONLAR = [
  { ad: "hatirlatmalar", etiket: "Rezervasyon hatırlatmaları" },
  { ad: "misafir-teyit", etiket: "Misafir teyidi (Gittin mi?)" },
];
// Cron 15 dakikada bir çalışır; bunun çok üstünde sessizlik sorun işaretidir.
const BAYAT_DAKIKA = 45;

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

export default async function AdminSistem() {
  const supabase = createServiceRoleClient();

  const sonCronlar = await Promise.all(
    CRONLAR.map(async (c) => {
      const { data } = await supabase
        .from("sistem_olaylari")
        .select("zaman, basarili, ozet")
        .eq("tur", "cron")
        .eq("ad", c.ad)
        .order("zaman", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...c, son: data };
    })
  );

  const { data: hatalar, error } = await supabase
    .from("sistem_olaylari")
    .select("id, ad, ozet, zaman")
    .eq("tur", "hata")
    .order("zaman", { ascending: false })
    .limit(30);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Sistem durumu</h1>
      <p className="mt-1 text-sm text-muted">
        Zamanlanmış görevlerin son çalışması ve son hatalar. Yeni hatalar admin e-postalarına da
        gelir (aynı hata için en fazla 30 dakikada bir).
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Günlük okunamadı. 0037 migration&apos;ı uygulandı mı?
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sonCronlar.map((c) => {
          // eslint-disable-next-line react-hooks/purity
          const gecenDk = c.son ? (Date.now() - new Date(c.son.zaman).getTime()) / 60000 : null;
          const bayat = gecenDk === null || gecenDk > BAYAT_DAKIKA;
          return (
            <div key={c.ad} className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.etiket}</p>
              <p className={`mt-1 text-sm font-bold ${bayat ? "text-red-600" : "text-green-700"}`}>
                {c.son
                  ? bayat
                    ? `Uzun süredir çalışmadı (${Math.round(gecenDk!)} dk)`
                    : "Çalışıyor"
                  : "Henüz kayıt yok"}
              </p>
              {c.son && (
                <p className="mt-1 text-xs text-muted">
                  Son: {zaman(c.son.zaman)} · {c.son.ozet}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-base font-bold text-foreground">Son hatalar</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
        {(hatalar ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Kayıtlı hata yok.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {(hatalar ?? []).map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-muted">{zaman(h.zaman)}</td>
                  <td className="px-4 py-2 font-semibold text-foreground">{h.ad}</td>
                  <td className="px-4 py-2 text-xs text-muted">{h.ozet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
