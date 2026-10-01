import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function restoranIdDogrula(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return restoran?.id ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const restoranId = await restoranIdDogrula(supabase);
  if (!restoranId) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const gövde = await request.json();
  const guncelleme: Record<string, unknown> = {};
  if (typeof gövde.isim === "string") guncelleme.isim = gövde.isim.slice(0, 40);
  if (typeof gövde.kapasite === "number") guncelleme.kapasite = Math.max(1, Math.round(gövde.kapasite));
  if (typeof gövde.alan === "string") guncelleme.alan = gövde.alan;
  if (typeof gövde.pozisyonX === "number") {
    guncelleme.pozisyon_x = Math.min(100, Math.max(0, gövde.pozisyonX));
  }
  if (typeof gövde.pozisyonY === "number") {
    guncelleme.pozisyon_y = Math.min(100, Math.max(0, gövde.pozisyonY));
  }

  const { error } = await supabase
    .from("restoran_masalari")
    .update(guncelleme)
    .eq("id", id)
    .eq("restoran_id", restoranId);

  if (error) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ basari: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const restoranId = await restoranIdDogrula(supabase);
  if (!restoranId) {
    return NextResponse.json({ hata: "Yetkiniz yok." }, { status: 403 });
  }

  const { error } = await supabase
    .from("restoran_masalari")
    .delete()
    .eq("id", id)
    .eq("restoran_id", restoranId);

  if (error) {
    return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ basari: true });
}
