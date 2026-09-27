import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tarih = searchParams.get("tarih");

  if (!tarih) {
    return NextResponse.json({ hata: "Tarih gerekli." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const gunBaslangic = new Date(`${tarih}T00:00:00`).toISOString();
  const gunBitis = new Date(`${tarih}T23:59:59`).toISOString();

  const { data } = await supabase
    .from("rezervasyonlar")
    .select("tarih_saat")
    .eq("restoran_id", id)
    .in("durum", ["beklemede", "onaylandi"])
    .gte("tarih_saat", gunBaslangic)
    .lte("tarih_saat", gunBitis);

  const saatBicimlendirici = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const doluSaatler = (data ?? []).map((r: { tarih_saat: string }) =>
    saatBicimlendirici.format(new Date(r.tarih_saat))
  );

  return NextResponse.json({ doluSaatler });
}
