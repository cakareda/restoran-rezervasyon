import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  SOZLESME_BELGELERI,
  SOZLESME_SURUMU,
  belgeKarmasi,
  RESTORAN_TICARI_SECIM,
  gecerliKabulBul,
  ticariKosullariHesapla,
} from "@/lib/sozlesme";

const BILGI_ALANLARI = [
  "unvan",
  "vergiDairesi",
  "vergiNo",
  "adres",
  "yetkiliAd",
  "yetkiliUnvan",
  "telefon",
  "eposta",
] as const;

// Restoranın sözleşmeyi ve eklerini elektronik olarak kabul edip imzalaması (Madde 26).
// Yalnızca giriş yapmış restoran sahibi çağırabilir; kayıt servis anahtarıyla yazılır ve
// sonradan değiştirilemez (bkz. 0034 migration'ındaki tetikleyici).
export async function POST(request: Request) {
  const oturum = await createClient();
  const {
    data: { user },
  } = await oturum.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { data: restoran } = await oturum
    .from("restoranlar")
    .select(`id, ${RESTORAN_TICARI_SECIM}`)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!restoran) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const govde = await request.json().catch(() => null);
  if (!govde) {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  // Aktivasyon = sözleşmenin ilk imzalandığı an; yenilemede mevcut aktivasyon korunur.
  const servis = createServiceRoleClient();
  const { count: oncekiKabul } = await servis
    .from("sozlesme_kabulleri")
    .select("id", { count: "exact", head: true })
    .eq("restoran_id", restoran.id);
  const ilkImza = (oncekiKabul ?? 0) === 0;
  const simdi = new Date().toISOString();

  const ticari = ticariKosullariHesapla(
    ilkImza ? { ...restoran, aktivasyon_tarihi: simdi } : restoran
  );
  if (!ticari) {
    return NextResponse.json(
      { hata: "Ticari koşullarınız (segment) henüz belirlenmedi. Lütfen Masadaki ile iletişime geçin." },
      { status: 409 }
    );
  }

  // Her belge için açık onay şart.
  for (const belge of SOZLESME_BELGELERI) {
    if (govde.onaylar?.[belge.kod] !== true) {
      return NextResponse.json({ hata: `${belge.ad} için onay kutusunu işaretlemelisiniz.` }, { status: 400 });
    }
  }

  const bilgiler: Record<string, string> = {};
  for (const alan of BILGI_ALANLARI) {
    bilgiler[alan] = String(govde.bilgiler?.[alan] ?? "").replace(/[<>]/g, "").trim().slice(0, 300);
  }
  for (const zorunlu of ["unvan", "vergiDairesi", "vergiNo", "adres", "yetkiliAd"] as const) {
    if (!bilgiler[zorunlu]) {
      return NextResponse.json({ hata: "Ticari unvan, vergi bilgileri, adres ve yetkili adı zorunludur." }, { status: 400 });
    }
  }

  const imzaGorseli = String(govde.imzaGorseli ?? "");
  if (
    !imzaGorseli.startsWith("data:image/png;base64,") ||
    imzaGorseli.length < 2500 ||
    imzaGorseli.length > 400_000
  ) {
    return NextResponse.json({ hata: "Lütfen imzanızı çizin." }, { status: 400 });
  }

  const mevcut = await gecerliKabulBul(servis, restoran.id);
  if (mevcut) {
    return NextResponse.json({ hata: "Bu sözleşme sürümü zaten imzalanmış." }, { status: 409 });
  }

  // Belge karmaları: PDF'ler kendi adreslerinden okunup SHA-256 alınır; dosya yoksa imza alınmaz.
  const origin = new URL(request.url).origin;
  const belgeler = [];
  for (const belge of SOZLESME_BELGELERI) {
    if (belge.url) {
      const karma = await belgeKarmasi(origin, belge.url);
      if (!karma) {
        return NextResponse.json(
          { hata: `"${belge.ad}" belgesi şu an erişilemiyor. Lütfen Masadaki ile iletişime geçin.` },
          { status: 503 }
        );
      }
      belgeler.push({ kod: belge.kod, ad: belge.ad, url: belge.url, sha256: karma });
    } else {
      belgeler.push({ kod: belge.kod, ad: belge.ad, url: null, sha256: null });
    }
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

  const { data: kayit, error } = await servis
    .from("sozlesme_kabulleri")
    .insert({
      restoran_id: restoran.id,
      sozlesme_surumu: SOZLESME_SURUMU,
      belgeler,
      ticari_kosullar: ticari,
      sozlesme_bitis: ticari.sozlesme_bitis,
      restoran_bilgileri: bilgiler,
      imza_adi: bilgiler.yetkiliAd,
      imza_unvani: bilgiler.yetkiliUnvan || null,
      imza_gorseli: imzaGorseli,
      kabul_eden_kullanici_id: user.id,
      kabul_eden_eposta: user.email ?? null,
      ip,
      user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
    })
    .select("kabul_no")
    .single();

  if (error || !kayit) {
    console.error("[Sözleşme kabul hatası]", error);
    return NextResponse.json({ hata: "Kabul kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });
  }

  if (ilkImza) {
    const { error: aktHata } = await servis
      .from("restoranlar")
      .update({ aktivasyon_tarihi: simdi })
      .eq("id", restoran.id);
    if (aktHata) console.error("[Aktivasyon tarihi yazılamadı]", aktHata);
  }

  return NextResponse.json({ basari: true, kabulNo: kayit.kabul_no });
}
