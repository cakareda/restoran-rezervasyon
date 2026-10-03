import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { DILLER } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const sonrakiSayfa = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // "kullanicilar" tablosu müşteri profili içindir — restoran/admin şifre
      // kurulumu/sıfırlaması bu akıştan geçtiğinde (next, /restoran veya /admin ile başlıyorsa)
      // oraya yanlışlıkla "misafir" kaydı açmayalım.
      if (!sonrakiSayfa.startsWith("/restoran") && !sonrakiSayfa.startsWith("/admin")) {
        const adSoyad =
          (data.user.user_metadata?.full_name as string | undefined) ??
          (data.user.user_metadata?.name as string | undefined) ??
          data.user.email ??
          "";
        const eposta = data.user.email ?? "";

        if (eposta) {
          const servisClient = createServiceRoleClient();
          // Sayfa dili (next-intl çerezi) ilk kayıtta profil diline yazılır; mevcut tercihi ezmeyiz.
          const cerezDili = /(?:^|;\s*)NEXT_LOCALE=([a-z]{2})/.exec(request.headers.get("cookie") ?? "")?.[1];
          const { data: mevcut } = await servisClient
            .from("kullanicilar")
            .select("dil")
            .eq("eposta", eposta)
            .maybeSingle();
          const dil = mevcut?.dil ?? (cerezDili && DILLER.includes(cerezDili as (typeof DILLER)[number]) ? cerezDili : "tr");
          await servisClient
            .from("kullanicilar")
            .upsert(
              { auth_user_id: data.user.id, ad_soyad: adSoyad, eposta, dil },
              { onConflict: "eposta" }
            );
        }
      }

      return NextResponse.redirect(`${origin}${sonrakiSayfa}`);
    }
  }

  return NextResponse.redirect(`${origin}/hesap/giris?hata=oturum_acilamadi`);
}
