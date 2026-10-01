import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { musaitlikHesapla } from "@/lib/kapasite";
import { istanbulTarihSaat } from "@/lib/tarih";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tarih = searchParams.get("tarih");
  const kisiSayisi = Number(searchParams.get("kisiSayisi") ?? 2);

  if (!tarih || !/^\d{4}-\d{2}-\d{2}$/.test(tarih) || Number.isNaN(new Date(`${tarih}T00:00:00`).getTime())) {
    return NextResponse.json({ hata: "Geçerli bir tarih gerekli (YYYY-MM-DD)." }, { status: 400 });
  }

  if (!Number.isInteger(kisiSayisi) || kisiSayisi < 1) {
    return NextResponse.json({ hata: "Geçerli bir kişi sayısı gerekli." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const gunBaslangic = new Date(`${tarih}T00:00:00`).toISOString();
  const gunBitis = new Date(`${tarih}T23:59:59`).toISOString();

  const [{ data: restoran }, { data: masalar }, { data: rezervasyonlar }] = await Promise.all([
    supabase.from("restoranlar").select("oturma_suresi_dk").eq("id", id).single(),
    supabase.from("masalar").select("kapasite, adet").eq("restoran_id", id),
    supabase
      .from("rezervasyonlar")
      .select("tarih_saat, masa_kapasitesi")
      .eq("restoran_id", id)
      .in("durum", ["beklemede", "onaylandi"])
      .gte("tarih_saat", gunBaslangic)
      .lte("tarih_saat", gunBitis),
  ]);

  const oturmaSuresiDk = restoran?.oturma_suresi_dk ?? 90;

  const saatBicimlendirici = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  // Günün tüm 30 dakikalık dilimlerini üret (00:00-23:30), her biri için müsaitlik kontrol et.
  const doluSaatler: string[] = [];
  for (let dk = 0; dk < 24 * 60; dk += 30) {
    const saat = String(Math.floor(dk / 60)).padStart(2, "0");
    const dakika = String(dk % 60).padStart(2, "0");
    const istenenBaslangic = istanbulTarihSaat(tarih, `${saat}:${dakika}`);

    const { musait } = musaitlikHesapla({
      istenenBaslangic,
      kisiSayisi,
      oturmaSuresiDk,
      masalar: masalar ?? [],
      aktifRezervasyonlar: rezervasyonlar ?? [],
    });

    if (!musait) {
      doluSaatler.push(saatBicimlendirici.format(istenenBaslangic));
    }
  }

  return NextResponse.json({ doluSaatler });
}
