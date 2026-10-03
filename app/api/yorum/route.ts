import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { rezervasyonId, puanYemek, puanServis, puanOrtam, yorumMetni } = body;

  if (!rezervasyonId || !puanYemek || !puanServis || !puanOrtam) {
    return NextResponse.json({ hata: "Eksik bilgi." }, { status: 400 });
  }
  for (const puan of [puanYemek, puanServis, puanOrtam]) {
    if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
      return NextResponse.json({ hata: "Puanlar 1 ile 5 arasında olmalı." }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const { data: rezervasyon } = await supabase
    .from("rezervasyonlar")
    .select("id, restoran_id, geldi_mi")
    .eq("id", rezervasyonId)
    .single();

  if (!rezervasyon || !rezervasyon.geldi_mi) {
    return NextResponse.json(
      { hata: "Bu rezervasyon için yorum bırakılamaz." },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("yorumlar").insert({
    rezervasyon_id: rezervasyonId,
    restoran_id: rezervasyon.restoran_id,
    puan_yemek: puanYemek,
    puan_servis: puanServis,
    puan_ortam: puanOrtam,
    yorum_metni: yorumMetni ? String(yorumMetni).slice(0, 1000) : null,
  });

  if (error) {
    return NextResponse.json({ hata: "Yorum kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
