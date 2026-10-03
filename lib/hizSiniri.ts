import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

function istemciIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "bilinmiyor";
}

/**
 * Hız sınırı: aşıldıysa 429 yanıtı döner, aksi halde null. Sayaç hata verirse (ör. migration
 * henüz uygulanmamış) isteği engellemez; hız sınırı kullanılabilirliği düşürmemeli.
 * `ek` verilirse (ör. e-posta) IP'ye ek olarak o değer için de ayrı sayaç tutulur.
 */
export async function hizSiniriKontrol(
  request: Request,
  uc: string,
  limit: number,
  saniye: number,
  ek?: string
): Promise<NextResponse | null> {
  const anahtarlar = [`${uc}:ip:${istemciIp(request)}`];
  if (ek) anahtarlar.push(`${uc}:ek:${ek.trim().toLowerCase().slice(0, 200)}`);

  try {
    const supabase = createServiceRoleClient();
    for (const anahtar of anahtarlar) {
      const { data, error } = await supabase.rpc("hiz_siniri_kontrol", {
        p_anahtar: anahtar,
        p_limit: limit,
        p_pencere_sn: saniye,
      });
      if (error) {
        console.error("[Hız sınırı]", error.message);
        return null;
      }
      if (data === true) {
        return NextResponse.json(
          { hata: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." },
          { status: 429, headers: { "Retry-After": String(saniye) } }
        );
      }
    }
  } catch (e) {
    console.error("[Hız sınırı]", e);
  }
  return null;
}
