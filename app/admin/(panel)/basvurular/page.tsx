import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import OnayFormu from "./OnayFormu";

export const metadata: Metadata = { title: "Başvurular — Admin" };

export default async function AdminBasvurular() {
  const supabase = createServiceRoleClient();
  const { data: basvurular } = await supabase
    .from("basvurular")
    .select("*")
    .order("olusturulma", { ascending: true });

  const bekleyenler = (basvurular ?? []).filter((b) => b.durum === "bekliyor");
  const tamamlananlar = (basvurular ?? []).filter((b) => b.durum !== "bekliyor");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Başvurular</h1>
      <p className="mt-1 text-sm text-muted">
        &quot;Bize ulaşın&quot; formundan gelen restoran başvuruları. Onaylarken şehir/semt/mutfak/fiyat
        seviyesini sen belirliyorsun, restoran hesabı otomatik açılıp giriş linki üretiliyor.
      </p>

      <div className="mt-6 space-y-3">
        {bekleyenler.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            Bekleyen başvuru yok.
          </p>
        )}
        {bekleyenler.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border bg-white p-4">
            <p className="font-bold text-foreground">{b.restoran_adi}</p>
            <p className="text-sm text-muted">
              {b.eposta} {b.telefon && `· ${b.telefon}`}
            </p>
            {b.masa_duzeni && (
              <p className="mt-1 text-xs text-muted">
                <span className="font-semibold">Masa düzeni:</span> {b.masa_duzeni}
              </p>
            )}
            {b.menu && (
              <p className="mt-0.5 text-xs text-muted">
                <span className="font-semibold">Menü:</span> {b.menu}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Başvuru: {new Date(b.olusturulma).toLocaleDateString("tr-TR")}
            </p>
            <OnayFormu basvuruId={b.id} restoranAdi={b.restoran_adi} />
          </div>
        ))}
      </div>

      {tamamlananlar.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Geçmiş başvurular</h2>
          <div className="mt-2 space-y-1.5">
            {tamamlananlar.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2 text-sm"
              >
                <span className="text-foreground">{b.restoran_adi}</span>
                <span className="text-xs text-muted">{b.durum}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
