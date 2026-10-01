import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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
    .maybeSingle();
  if (!restoran) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const { isim, kapasite, alan, pozisyonX, pozisyonY, sekil } = await request.json();
  if (!isim || !kapasite || kapasite < 1) {
    return NextResponse.json({ hata: "Masa adı ve kapasite zorunlu." }, { status: 400 });
  }

  const { data: masa, error } = await supabase
    .from("restoran_masalari")
    .insert({
      restoran_id: restoran.id,
      isim: String(isim).slice(0, 40),
      kapasite: Math.max(1, Math.round(Number(kapasite))),
      alan: alan ?? "",
      pozisyon_x: pozisyonX ?? 10,
      pozisyon_y: pozisyonY ?? 10,
      sekil: sekil === "daire" ? "daire" : "dikdortgen",
    })
    .select()
    .single();

  if (error || !masa) {
    return NextResponse.json({ hata: "Masa eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ masa });
}
