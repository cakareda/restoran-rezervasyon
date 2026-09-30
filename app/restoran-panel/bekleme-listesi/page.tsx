import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { BeklemeKaydi } from "@/lib/types";
import BeklemeSatiri from "./BeklemeSatiri";

export const metadata: Metadata = { title: "Bekleme Listesi" };

export default async function BeklemeListesi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  if (!restoran) {
    return <p className="text-muted">Önce restoran profilinizi tamamlayın.</p>;
  }

  const { data: kayitlar } = await supabase
    .from("bekleme_listesi")
    .select("*")
    .eq("restoran_id", restoran.id)
    .order("tarih", { ascending: true })
    .order("saat", { ascending: true });

  const liste = (kayitlar ?? []) as BeklemeKaydi[];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Bekleme Listesi</h1>
      <p className="mt-1 text-sm text-muted">
        Müsait masa bulunamadığında misafirlerin kendini eklediği liste. Yer açılırsa misafiri
        arayıp haber verebilirsin.
      </p>

      <div className="mt-6 space-y-3">
        {liste.length > 0 ? (
          liste.map((k) => <BeklemeSatiri key={k.id} kayit={k} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            Bekleme listesinde kimse yok.
          </p>
        )}
      </div>
    </div>
  );
}
