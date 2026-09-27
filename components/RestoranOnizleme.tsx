import { OLANAK_ETIKETLERI } from "@/lib/types";
import { fiyatGoster } from "@/lib/format";
import { KonumIkonu, SaatIkonu, TabakIkonu } from "@/components/icons";
import OlanakIkonu from "@/components/OlanakIkonu";

export default function RestoranOnizleme({
  ad,
  sehir,
  semt,
  mutfakTuru,
  ortalamaFiyat,
  adres,
  acilisSaati,
  kapanisSaati,
  olanaklar,
  fotograflar,
}: {
  ad: string;
  sehir: string;
  semt: string;
  mutfakTuru: string;
  ortalamaFiyat: string;
  adres: string;
  acilisSaati: string;
  kapanisSaati: string;
  olanaklar: string[];
  fotograflar: string[];
}) {
  const secilenOlanaklar = OLANAK_ETIKETLERI.filter((o) => olanaklar.includes(o.deger));
  const bilinenDegerler = OLANAK_ETIKETLERI.map((o) => o.deger) as string[];
  const ozelOlanaklar = olanaklar.filter((o) => !bilinenDegerler.includes(o));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {fotograflar.length > 0 ? (
        <img src={fotograflar[0]} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center bg-brand-light">
          <TabakIkonu className="h-8 w-8 text-brand/40" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-extrabold text-foreground">{ad || "Restoran adı"}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {semt || "Semt"}, {sehir || "Şehir"} · {mutfakTuru || "Mutfak türü"}
        </p>

        {fiyatGoster(ortalamaFiyat) && (
          <span className="mt-2 inline-block rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
            {fiyatGoster(ortalamaFiyat)}
          </span>
        )}

        {(secilenOlanaklar.length > 0 || ozelOlanaklar.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {secilenOlanaklar.map((o) => (
              <span
                key={o.deger}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground"
              >
                <OlanakIkonu deger={o.deger} className="h-3 w-3 text-muted" />
                {o.etiket}
              </span>
            ))}
            {ozelOlanaklar.map((o) => (
              <span
                key={o}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground"
              >
                {o}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-1 text-xs text-muted">
          {adres && (
            <p className="flex items-center gap-1.5">
              <KonumIkonu className="h-3.5 w-3.5 text-brand" /> {adres}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <SaatIkonu className="h-3.5 w-3.5 text-brand" /> Her gün {acilisSaati} - {kapanisSaati}
          </p>
        </div>
      </div>
    </div>
  );
}
