import { getTranslations } from "next-intl/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import YorumFormu from "./YorumFormu";

type RezervasyonRestoranli = {
  id: string;
  geldi_mi: boolean | null;
  restoran_id: string;
  restoranlar: { ad: string } | null;
};

export default async function YorumSayfasi({
  params,
}: {
  params: Promise<{ rezervasyonId: string }>;
}) {
  const { rezervasyonId } = await params;
  const t = await getTranslations("Yorum");
  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = (await supabase
    .from("rezervasyonlar")
    .select("id, geldi_mi, restoran_id, restoranlar(ad)")
    .eq("id", rezervasyonId)
    .single()) as { data: RezervasyonRestoranli | null };

  const { data: mevcutYorum } = rezervasyon
    ? await supabase
        .from("yorumlar")
        .select("id")
        .eq("rezervasyon_id", rezervasyonId)
        .maybeSingle()
    : { data: null };

  const restoranAd = rezervasyon?.restoranlar?.ad ?? t("restoranVarsayilan");

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-extrabold text-foreground">
          {t("baslik", { restoran: restoranAd })}
        </h1>

        {!rezervasyon || !rezervasyon.geldi_mi ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            {t("bosBirakilamaz")}
          </p>
        ) : mevcutYorum ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            {t("zatenYorumYapilmis")}
          </p>
        ) : (
          <div className="mt-6">
            <YorumFormu rezervasyonId={rezervasyonId} />
          </div>
        )}
      </div>
    </div>
  );
}
