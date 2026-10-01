import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { masaIdler } = (await request.json()) as { masaIdler: string[] };

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

  const { data: rezervasyon } = await supabase
    .from("rezervasyonlar")
    .select("id, kisi_sayisi")
    .eq("id", id)
    .eq("restoran_id", restoran.id)
    .maybeSingle();
  if (!rezervasyon) {
    return NextResponse.json({ hata: "Rezervasyon bulunamadı." }, { status: 404 });
  }

  // Boş liste = atamayı kaldır (masayı serbest bırak).
  if (!masaIdler || masaIdler.length === 0) {
    await supabase.from("rezervasyonlar").update({ atanan_masa_idler: null }).eq("id", id);
    return NextResponse.json({ basari: true });
  }

  const { data: masalar } = await supabase
    .from("restoran_masalari")
    .select("id, kapasite")
    .eq("restoran_id", restoran.id)
    .in("id", masaIdler);

  if (!masalar || masalar.length !== masaIdler.length) {
    return NextResponse.json({ hata: "Geçersiz masa seçimi." }, { status: 400 });
  }

  const toplamKapasite = masalar.reduce((t, m) => t + m.kapasite, 0);
  if (toplamKapasite < rezervasyon.kisi_sayisi) {
    return NextResponse.json(
      { hata: `Seçilen masalar ${rezervasyon.kisi_sayisi} kişiye yetmiyor (toplam ${toplamKapasite} kişi).` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("rezervasyonlar")
    .update({ atanan_masa_idler: masaIdler })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ hata: "Masa atanamadı." }, { status: 500 });
  }
  return NextResponse.json({ basari: true });
}
