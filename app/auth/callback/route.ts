import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Google ile ilk kez giriş yapan kullanıcı için kullanicilar kaydı oluştur/güncelle.
      const adSoyad =
        (data.user.user_metadata?.full_name as string | undefined) ||
        (data.user.user_metadata?.name as string | undefined) ||
        data.user.email ||
        "Kullanıcı";

      const service = createServiceRoleClient();
      await service.from("kullanicilar").upsert(
        {
          auth_user_id: data.user.id,
          ad_soyad: adSoyad,
          eposta: data.user.email!,
        },
        { onConflict: "eposta" }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/hesap/giris?hata=oauth`);
}
