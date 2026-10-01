import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { teyitTokenDogrula } from "@/lib/misafirTeyit";

// Misafirin e-postadaki "Evet, geldim" / "Hayır, gelmedim" linkine tıklamasıyla
// çalışan, girişsiz, token imzalı uç nokta. Restoranın tek taraflı "Geldi"
// işaretlemesine karşı bağımsız bir misafir teyidi kaydeder (bkz. sözleşme Madde 5).
function sayfa(baslik: string, mesaj: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${baslik} — Masadaki</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f1ea; margin: 0; padding: 48px 16px; display: flex; justify-content: center; }
  .kart { max-width: 420px; width: 100%; background: #fff; border-radius: 16px; padding: 32px 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
  h1 { font-size: 20px; color: #1f2937; margin: 0 0 12px; }
  p { font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0; }
</style>
</head>
<body>
  <div class="kart">
    <h1>${baslik}</h1>
    <p>${mesaj}</p>
  </div>
</body>
</html>`;
}

function htmlYanit(baslik: string, mesaj: string, status = 200) {
  return new NextResponse(sayfa(baslik, mesaj), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const cevap = url.searchParams.get("cevap") ?? "";
  const token = url.searchParams.get("token") ?? "";

  if (!teyitTokenDogrula(id, cevap, token)) {
    return htmlYanit(
      "Geçersiz bağlantı",
      "Bu bağlantının süresi dolmuş veya geçersiz görünüyor.",
      400
    );
  }

  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = await supabase
    .from("rezervasyonlar")
    .select("id, misafir_teyit")
    .eq("id", id)
    .maybeSingle();

  if (!rezervasyon) {
    return htmlYanit("Rezervasyon bulunamadı", "Bu rezervasyon artık mevcut değil.", 404);
  }

  if (rezervasyon.misafir_teyit !== null) {
    return htmlYanit("Zaten yanıtlandı", "Bu rezervasyon için daha önce bir yanıt kaydettin, teşekkürler.");
  }

  await supabase
    .from("rezervasyonlar")
    .update({ misafir_teyit: cevap === "evet", misafir_teyit_zamani: new Date().toISOString() })
    .eq("id", id);

  if (cevap === "evet") {
    return htmlYanit("Teşekkürler!", "Ziyaretini onayladın, restorana bildirdik.");
  }
  return htmlYanit(
    "Kaydedildi",
    "Gelmediğini bildirdin. Restoranın kaydıyla uyuşmazlık varsa ekibimiz inceleyecek."
  );
}
