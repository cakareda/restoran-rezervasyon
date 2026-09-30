import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RezervasyonFormu from "@/components/RezervasyonFormu";
import trMesajlar from "@/messages/tr.json";

export default async function WidgetSayfasi({
  params,
}: {
  params: Promise<{ restoranId: string }>;
}) {
  const { restoranId } = await params;
  const supabase = await createClient();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select(
      "id, ad, acilis_saati, kapanis_saati, calisma_saatleri, ozel_gunler, maksimum_kisi_sayisi, en_erken_rezervasyon_saat, en_gec_rezervasyon_gun"
    )
    .eq("id", restoranId)
    .maybeSingle();

  if (!restoran) notFound();

  const { data: masaVerisi } = await supabase
    .from("masalar")
    .select("alan")
    .eq("restoran_id", restoranId);
  const alanlar = Array.from(
    new Set((masaVerisi ?? []).map((m: { alan: string }) => m.alan).filter(Boolean))
  ).sort();

  return (
    <NextIntlClientProvider locale="tr" messages={trMesajlar}>
      <div className="min-h-screen bg-transparent p-3">
        <p className="mb-2 text-center text-xs font-semibold text-muted">
          {restoran.ad} — Masadaki üzerinden rezervasyon
        </p>
        <RezervasyonFormu
          restoranId={restoran.id}
          restoranAd={restoran.ad}
          acilisSaati={restoran.acilis_saati.slice(0, 5)}
          kapanisSaati={restoran.kapanis_saati.slice(0, 5)}
          calismaSaatleriJson={restoran.calisma_saatleri}
          ozelGunlerJson={restoran.ozel_gunler}
          alanlar={alanlar}
          maksimumKisi={restoran.maksimum_kisi_sayisi}
          enErkenSaat={restoran.en_erken_rezervasyon_saat}
          enGecGun={restoran.en_gec_rezervasyon_gun}
        />
      </div>
    </NextIntlClientProvider>
  );
}
