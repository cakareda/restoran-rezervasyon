import { permanentRedirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugYap } from "@/lib/slug";

export default async function EskiRestoranAdresi({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();
  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("ad, sehir, semt")
    .eq("id", id)
    .single();

  if (!restoran) notFound();

  const yeniYol = `/${slugYap(restoran.sehir)}/${slugYap(restoran.semt)}/${slugYap(restoran.ad)}`;
  const onek = locale === "tr" ? "" : `/${locale}`;
  permanentRedirect(`${onek}${yeniYol}`);
}
