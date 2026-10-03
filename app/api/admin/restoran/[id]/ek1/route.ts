import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminMi } from "@/lib/admin";

const metin = (v: unknown, max: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

// Ek-1'in restorana özel alanları (üyelik paketi, hesaplaşma dönemi, vade, ödeme yöntemi).
// Yalnızca admin; restoran imzadan önce bu değerleri imza ekranında görür.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const oturum = await createClient();
  const {
    data: { user },
  } = await oturum.auth.getUser();
  if (!adminMi(user?.email)) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const govde = await request.json().catch(() => null);
  if (!govde) return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });

  const ucretHam = String(govde.uyelikAylikUcretTl ?? "").replace(",", ".").trim();
  const ucret = ucretHam === "" ? null : Number(ucretHam);
  if (ucret !== null && (!Number.isFinite(ucret) || ucret < 0 || ucret > 1_000_000)) {
    return NextResponse.json({ hata: "Üyelik ücreti geçersiz." }, { status: 400 });
  }
  const vade = Number(govde.odemeVadesiGun);
  if (!Number.isInteger(vade) || vade < 0 || vade > 90) {
    return NextResponse.json({ hata: "Ödeme vadesi 0-90 gün olmalı." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("restoranlar")
    .update({
      uyelik_paketi: metin(govde.uyelikPaketi, 100) || null,
      uyelik_aylik_ucret_tl: ucret,
      hesaplasma_donemi: metin(govde.hesaplasmaDonemi, 50) || "Aylık",
      odeme_vadesi_gun: vade,
      odeme_yontemi: metin(govde.odemeYontemi, 100) || "Havale / EFT",
    })
    .eq("id", id);
  if (error) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ basari: true });
}
