import { createServiceRoleClient } from "@/lib/supabase/server";
import IptalKarti from "./IptalKarti";

type RezervasyonDetay = {
  id: string;
  tarih_saat: string;
  kisi_sayisi: number;
  durum: string;
  restoran_id: string;
  restoranlar: { ad: string } | null;
};

export default async function RezervasyonIptal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ degistir?: string }>;
}) {
  const { id } = await params;
  const { degistir } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = (await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, durum, restoran_id, restoranlar(ad)")
    .eq("id", id)
    .single()) as { data: RezervasyonDetay | null };

  const restoranAd = rezervasyon?.restoranlar?.ad ?? "Restoran";
  const gecmisMi = rezervasyon ? new Date(rezervasyon.tarih_saat) < new Date() : false;
  const aktifMi =
    rezervasyon && rezervasyon.durum !== "iptal_edildi" && rezervasyon.durum !== "reddedildi";

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-extrabold text-foreground">
          {degistir ? "Rezervasyonu Değiştir" : "Rezervasyonu İptal Et"}
        </h1>

        {!rezervasyon ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            Rezervasyon bulunamadı.
          </p>
        ) : !aktifMi ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            Bu rezervasyon zaten aktif değil.
          </p>
        ) : gecmisMi ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-muted shadow-sm">
            Bu rezervasyonun tarihi geçmiş, iptal edilemez.
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="font-bold text-foreground">{restoranAd}</p>
              <p className="mt-1 text-sm text-muted">
                {new Date(rezervasyon.tarih_saat).toLocaleString("tr-TR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}{" "}
                · {rezervasyon.kisi_sayisi} kişi
              </p>
            </div>
            <IptalKarti id={rezervasyon.id} restoranId={rezervasyon.restoran_id} degistir={!!degistir} />
          </>
        )}
      </div>
    </div>
  );
}
