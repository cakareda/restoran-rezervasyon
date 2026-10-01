import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Telefon/OTP ile giriş yapan kullanıcı için kullanicilar satırını oluşturur/günceller.
// E-posta ile farklı: eşleştirme auth_user_id üzerinden yapılır (telefon
// kullanıcılarının e-postası olmayabilir, "eposta" alanına göre eşleştirme
// birden fazla kullanıcıyı aynı satıra düşürebilirdi).
export async function POST(request: Request) {
  const { authUserId, telefon } = await request.json();

  if (!authUserId || !telefon) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: mevcut } = await supabase
    .from("kullanicilar")
    .select("id, ad_soyad")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const { error } = await supabase.from("kullanicilar").upsert(
    {
      auth_user_id: authUserId,
      telefon,
      ad_soyad: mevcut?.ad_soyad || "Misafir",
    },
    { onConflict: "auth_user_id" }
  );

  if (error) {
    return NextResponse.json({ hata: "Hesap profili oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
