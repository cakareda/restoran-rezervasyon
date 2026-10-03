import { NextResponse } from "next/server";
import { hizSiniriKontrol } from "@/lib/hizSiniri";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DILLER } from "@/i18n/routing";

// Telefon/OTP ile giriş yapan kullanıcı için kullanicilar satırını oluşturur/günceller.
// E-posta ile farklı: eşleştirme auth_user_id üzerinden yapılır (telefon
// kullanıcılarının e-postası olmayabilir, "eposta" alanına göre eşleştirme
// birden fazla kullanıcıyı aynı satıra düşürebilirdi).
export async function POST(request: Request) {
  const hiz = await hizSiniriKontrol(request, "hesap-tel", 10, 3600);
  if (hiz) return hiz;
  const { authUserId, telefon, dil } = await request.json();

  if (!authUserId || !telefon) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: mevcut } = await supabase
    .from("kullanicilar")
    .select("id, ad_soyad, dil")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const { error } = await supabase.from("kullanicilar").upsert(
    {
      auth_user_id: authUserId,
      telefon,
      ad_soyad: mevcut?.ad_soyad || "Misafir",
      dil: mevcut?.dil ?? (DILLER.includes(dil) ? dil : null),
    },
    { onConflict: "auth_user_id" }
  );

  if (error) {
    return NextResponse.json({ hata: "Hesap profili oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
