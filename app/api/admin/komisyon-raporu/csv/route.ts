import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminMi } from "@/lib/admin";
import { komisyonRaporuHesapla } from "@/lib/komisyonRaporu";

const KDV_ORANI = 0.2;

// CSV/Excel hücresinde formül çalıştırılmasını engeller (=, +, -, @ ile başlayan metinler).
function hucre(deger: string | number | null | undefined): string {
  let s = String(deger ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const para = (n: number) => n.toFixed(2).replace(".", ",");

// Aylık fatura özeti: restoran başına fatura satırı (muhasebeciye verilmek üzere).
// Yalnızca admin oturumu; ücretli tutarı olmayan restoranlar dahil edilmez.
export async function GET(request: Request) {
  const oturum = await createClient();
  const {
    data: { user },
  } = await oturum.auth.getUser();
  if (!adminMi(user?.email)) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const ay = new URL(request.url).searchParams.get("ay");
  let sonuc;
  try {
    sonuc = await komisyonRaporuHesapla(ay);
  } catch {
    return NextResponse.json({ hata: "Rapor hesaplanamadı." }, { status: 500 });
  }

  // Fatura bilgileri: restoranın imza sırasında beyan ettiği unvan ve vergi bilgileri.
  const servis = createServiceRoleClient();
  const { data: kabuller } = await servis
    .from("sozlesme_kabulleri")
    .select("restoran_id, restoran_bilgileri, kabul_zamani")
    .order("kabul_zamani", { ascending: true });
  const bilgi = new Map<string, Record<string, string>>();
  for (const k of kabuller ?? []) bilgi.set(k.restoran_id, k.restoran_bilgileri ?? {});

  const baslik = [
    "Dönem", "Restoran", "Fatura unvanı", "Vergi dairesi", "Vergi no", "Adres", "E-posta",
    "Ücretli rezervasyon", "Ücretli kişi", "Kişi başı bedel (TL)", "Ara toplam (TL)",
    "KDV %20 (TL)", "Genel toplam (TL)", "Misafir uyarısı", "İnceleme",
  ];

  const satirlar = sonuc.satirlar
    .filter((s) => s.toplamTutar > 0)
    .map((s) => {
      const b = bilgi.get(s.restoranId) ?? {};
      const kdv = s.toplamTutar * KDV_ORANI;
      return [
        sonuc.ay, s.restoranAd, b.unvan ?? "", b.vergiDairesi ?? "", b.vergiNo ?? "", b.adres ?? "",
        b.eposta || s.restoranEposta,
        s.ucretliRezervasyonSayisi, s.ucretliKisiSayisi, s.birimTutar,
        para(s.toplamTutar), para(kdv), para(s.toplamTutar + kdv),
        s.misafirUyarisiSayisi, s.incelemeSayisi,
      ].map(hucre).join(";");
    });

  // BOM + noktalı virgül: Türkçe Excel'de doğrudan açılır.
  const csv = "﻿" + [baslik.map(hucre).join(";"), ...satirlar].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="masadaki-fatura-ozeti-${sonuc.ay}.csv"`,
    },
  });
}
