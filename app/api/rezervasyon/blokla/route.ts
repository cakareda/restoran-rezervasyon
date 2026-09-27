import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { tarihSaat, kisiSayisi } = await request.json();

  if (!tarihSaat) {
    return NextResponse.json({ hata: "Tarih ve saat gerekli." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  const { error } = await supabase.from("rezervasyonlar").insert({
    restoran_id: restoran.id,
    kullanici_id: null,
    tarih_saat: tarihSaat,
    kisi_sayisi: kisiSayisi ?? 1,
    durum: "onaylandi",
    kaynak: "telefon",
  });

  if (error) {
    return NextResponse.json({ hata: "Saat bloklanamadı." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
