import { createClient } from "@/lib/supabase/server";
import type { Restoran } from "@/lib/types";
import { restoranBazindaPuanla } from "@/lib/puanlama";
import RestoranKarti from "@/components/RestoranKarti";

export default async function RestoranlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{
    sehir?: string;
    semt?: string;
    mutfakTuru?: string;
    ara?: string;
    minPuan?: string;
  }>;
}) {
  const { sehir, semt, mutfakTuru, ara, minPuan } = await searchParams;
  const supabase = await createClient();

  let sorgu = supabase.from("restoranlar").select("*").order("ad");

  if (sehir) sorgu = sorgu.ilike("sehir", `%${sehir}%`);
  if (semt) sorgu = sorgu.ilike("semt", `%${semt}%`);
  if (mutfakTuru) sorgu = sorgu.ilike("mutfak_turu", `%${mutfakTuru}%`);
  if (ara) sorgu = sorgu.ilike("ad", `%${ara}%`);

  const [{ data: tumRestoranlar }, { data: yorumlar }] = await Promise.all([
    sorgu,
    supabase.from("yorumlar").select("restoran_id, puan_yemek, puan_servis, puan_ortam"),
  ]);

  const puanlar = restoranBazindaPuanla(yorumlar ?? []);
  const minPuanSayi = minPuan ? Number(minPuan) : 0;
  const restoranlar = (tumRestoranlar ?? []).filter(
    (r) => (puanlar.get(r.id)?.ortalama ?? 0) >= minPuanSayi
  );
  const filtreliMi = Boolean(sehir || semt || mutfakTuru || ara || minPuan);

  return (
    <div>
      <section className="border-b border-border bg-brand-light">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Restoranları keşfet
          </h1>

          <form
            method="get"
            className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg shadow-black/5 sm:flex-row"
          >
            <input
              type="text"
              name="ara"
              defaultValue={ara}
              placeholder="Restoran adı"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
            <input
              type="text"
              name="sehir"
              defaultValue={sehir}
              placeholder="Şehir"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
            <input
              type="text"
              name="mutfakTuru"
              defaultValue={mutfakTuru}
              placeholder="Mutfak türü"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            />
            <select
              name="minPuan"
              defaultValue={minPuan ?? ""}
              className="rounded-xl border-0 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
            >
              <option value="">Tüm puanlar</option>
              <option value="4.5">4.5+ ★</option>
              <option value="4">4+ ★</option>
              <option value="3">3+ ★</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Ara
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-xl font-bold text-foreground">
          {filtreliMi ? "Arama sonuçları" : "Tüm restoranlar"}
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restoranlar && restoranlar.length > 0 ? (
            restoranlar.map((restoran: Restoran) => {
              const puan = puanlar.get(restoran.id);
              return (
                <RestoranKarti
                  key={restoran.id}
                  restoran={restoran}
                  ortalamaPuan={puan?.ortalama ?? null}
                  yorumSayisi={puan?.sayi ?? 0}
                />
              );
            })
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-border py-16 text-center text-muted">
              Aramanıza uygun restoran bulunamadı.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
