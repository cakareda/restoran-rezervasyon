import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DILLER } from "@/i18n/routing";

export async function POST(request: Request) {
  const { authUserId, adSoyad, eposta, telefon, dil } = await request.json();
  const gecerliDil = DILLER.includes(dil) ? dil : null;

  if (!authUserId || !adSoyad || !eposta) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("kullanicilar").upsert(
    { auth_user_id: authUserId, ad_soyad: adSoyad, eposta, telefon: telefon ?? null, dil: gecerliDil },
    { onConflict: "eposta" }
  );

  if (error) {
    return NextResponse.json({ hata: "Hesap profili oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
