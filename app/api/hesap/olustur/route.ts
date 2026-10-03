import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DILLER } from "@/i18n/routing";

// Kayıt sonrası müşteri profili (kullanicilar satırı) oluşturur.
// Bu uç nokta girişsiz çağrılabildiği için (e-posta onayı beklenirken henüz oturum yok)
// istemciden gelen authUserId/eposta'ya güvenmiyoruz: kullanıcı Supabase Auth'ta
// gerçekten var mı ve e-postası eşleşiyor mu sunucuda doğruluyoruz. Ayrıca mevcut bir
// profili başka bir hesaba bağlamıyoruz (hesap/rezervasyon ele geçirmeyi önlemek için).
export async function POST(request: Request) {
  const { authUserId, adSoyad, eposta, telefon, dil } = await request.json();
  const gecerliDil = DILLER.includes(dil) ? dil : null;

  if (!authUserId || !adSoyad || !eposta) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const temizAd = String(adSoyad).replace(/[<>]/g, "").trim().slice(0, 100);
  if (!temizAd) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: authKullanici } = await supabase.auth.admin.getUserById(String(authUserId));
  const gercekEposta = authKullanici?.user?.email?.toLowerCase();
  if (!authKullanici?.user || !gercekEposta || gercekEposta !== String(eposta).trim().toLowerCase()) {
    return NextResponse.json({ hata: "Hesap doğrulanamadı." }, { status: 403 });
  }
  const authId = authKullanici.user.id;
  const epostaOnayli = Boolean(authKullanici.user.email_confirmed_at);

  const { data: mevcut } = await supabase
    .from("kullanicilar")
    .select("id, auth_user_id")
    .eq("eposta", gercekEposta)
    .maybeSingle();

  if (mevcut?.auth_user_id && mevcut.auth_user_id !== authId) {
    return NextResponse.json({ hata: "Bu e-posta başka bir hesaba bağlı." }, { status: 409 });
  }

  if (!mevcut) {
    const { error } = await supabase.from("kullanicilar").insert({
      auth_user_id: authId,
      ad_soyad: temizAd,
      eposta: gercekEposta,
      telefon: telefon ?? null,
      dil: gecerliDil,
    });
    if (error) {
      return NextResponse.json({ hata: "Hesap profili oluşturulamadı." }, { status: 500 });
    }
    return NextResponse.json({ basari: true });
  }

  // Daha önce misafir olarak rezervasyon yapılmış, hesabı olmayan bir profil var:
  // yalnızca e-posta onaylıysa bağla. Onaysızsa profil, ilk girişte (profil sayfası)
  // bağlanır; böylece başkasının e-postasıyla kayıt olup geçmişine erişilemez.
  if (epostaOnayli) {
    await supabase
      .from("kullanicilar")
      .update({
        auth_user_id: authId,
        ad_soyad: temizAd,
        telefon: telefon ?? null,
        dil: gecerliDil,
      })
      .eq("id", mevcut.id);
  }

  return NextResponse.json({ basari: true });
}
