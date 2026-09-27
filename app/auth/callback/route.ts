import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const sonrakiSayfa = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const adSoyad =
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        data.user.email ??
        "";
      const eposta = data.user.email ?? "";

      if (eposta) {
        const servisClient = createServiceRoleClient();
        await servisClient
          .from("kullanicilar")
          .upsert(
            { auth_user_id: data.user.id, ad_soyad: adSoyad, eposta },
            { onConflict: "eposta" }
          );
      }

      return NextResponse.redirect(`${origin}${sonrakiSayfa}`);
    }
  }

  return NextResponse.redirect(`${origin}/hesap/giris?hata=oturum_acilamadi`);
}
