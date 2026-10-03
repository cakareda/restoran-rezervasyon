import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { adminEpostalari } from "@/lib/admin";
import { resend, GONDEREN_EPOSTA } from "@/lib/email/resend";

const metin = (v: unknown) => String(v ?? "").replace(/[<>&]/g, "").slice(0, 500);

/**
 * Beklenmeyen hatayı sistem günlüğüne yazar ve (aynı konu için en fazla 30 dakikada bir)
 * admin e-postalarına bildirir. Hiçbir koşulda istisna fırlatmaz: izleme asıl işi bozmamalı.
 */
export async function hataBildir(ad: string, detay: unknown) {
  try {
    const ozet = metin(detay instanceof Error ? detay.message : detay);
    const supabase = createServiceRoleClient();
    await supabase.from("sistem_olaylari").insert({ tur: "hata", ad, basarili: false, ozet });

    const { data: asildi } = await supabase.rpc("hiz_siniri_kontrol", {
      p_anahtar: `uyari:${ad}`,
      p_limit: 1,
      p_pencere_sn: 1800,
    });
    if (asildi === true) return;

    const alicilar = adminEpostalari();
    if (alicilar.length === 0) return;
    await resend.emails.send({
      from: GONDEREN_EPOSTA,
      to: alicilar,
      subject: `[Masadaki] Sistem uyarısı: ${metin(ad)}`,
      html: `<p><b>${metin(ad)}</b></p><p>${ozet}</p><p>Detay: admin → Sistem sayfası.</p>`,
    });
  } catch (e) {
    console.error("[Sistem izleme]", e);
  }
}

/** Cron route'unu sarar: her çalışmayı kaydeder, hata/5xx olursa admini uyarır. */
export function cronSarmala(ad: string, isleyici: (request: Request) => Promise<NextResponse>) {
  return async function GET(request: Request) {
    let yanit: NextResponse;
    try {
      yanit = await isleyici(request);
    } catch (e) {
      await hataBildir(`cron:${ad}`, e);
      return NextResponse.json({ hata: "Cron hatası." }, { status: 500 });
    }

    // Yetkisiz çağrıları (401) kaydetme; yalnızca gerçek çalışmalar.
    if (yanit.status === 401) return yanit;

    const basarili = yanit.status < 500;
    let ozet = `HTTP ${yanit.status}`;
    try {
      ozet = metin(await yanit.clone().text());
    } catch {}

    if (!basarili) {
      await hataBildir(`cron:${ad}`, ozet);
    } else {
      try {
        const supabase = createServiceRoleClient();
        await supabase.from("sistem_olaylari").insert({ tur: "cron", ad, basarili: true, ozet });
        if (Math.random() < 0.02) {
          await supabase
            .from("sistem_olaylari")
            .delete()
            .lt("zaman", new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString());
        }
      } catch {}
    }
    return yanit;
  };
}
