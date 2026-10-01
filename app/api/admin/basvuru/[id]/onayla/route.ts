import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminMi } from "@/lib/admin";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com").replace(/\/$/, "");
const SIFRE_BELIRLEME_YOLU = "/auth/callback?next=/restoran-girisi/sifre-sifirla";

// restoran-ekle.js scriptinin panel içi karşılığı — aynı mantık: şifreyi biz
// üretip iletmek yerine Supabase'in tek kullanımlık giriş linkini üretiyoruz.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const oturumClient = await createClient();
  const {
    data: { user },
  } = await oturumClient.auth.getUser();

  if (!adminMi(user?.email)) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const { sehir, semt, mutfakTuru, fiyatSeviyesi } = await request.json();
  if (!sehir || !semt || !mutfakTuru || ![1, 2, 3, 4].includes(Number(fiyatSeviyesi))) {
    return NextResponse.json({ hata: "Şehir, semt, mutfak türü ve fiyat seviyesi zorunlu." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: basvuru } = await supabase
    .from("basvurular")
    .select("*")
    .eq("id", id)
    .eq("durum", "bekliyor")
    .maybeSingle();

  if (!basvuru) {
    return NextResponse.json({ hata: "Başvuru bulunamadı ya da zaten işlendi." }, { status: 404 });
  }

  const { data: varOlanKullanicilar } = await supabase.auth.admin.listUsers();
  const mevcutHesap = varOlanKullanicilar?.users?.find((u) => u.email === basvuru.eposta);

  let userId: string;
  let girisLinki: string;

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: mevcutHesap ? "recovery" : "invite",
      email: basvuru.eposta,
      options: { redirectTo: `${SITE_URL}${SIFRE_BELIRLEME_YOLU}` },
    });
    if (error) throw error;
    userId = data.user.id;
    girisLinki = data.properties.action_link;
  } catch (e) {
    return NextResponse.json(
      { hata: `Hesap/giriş linki oluşturulamadı: ${e instanceof Error ? e.message : "bilinmeyen hata"}` },
      { status: 500 }
    );
  }

  const { data: restoran, error: restoranHata } = await supabase
    .from("restoranlar")
    .upsert(
      {
        auth_user_id: userId,
        ad: basvuru.restoran_adi,
        sehir,
        semt,
        mutfak_turu: mutfakTuru,
        eposta: basvuru.eposta,
        telefon: basvuru.telefon,
        fiyat_seviyesi: Number(fiyatSeviyesi),
      },
      { onConflict: "auth_user_id" }
    )
    .select("id")
    .single();

  if (restoranHata || !restoran) {
    return NextResponse.json({ hata: "Restoran kaydedilemedi." }, { status: 500 });
  }

  await supabase.from("basvurular").update({ durum: "tamamlandi" }).eq("id", id);

  return NextResponse.json({ basari: true, restoranId: restoran.id, girisLinki });
}
