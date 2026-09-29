import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { not } = await request.json();

  const oturumClient = await createClient();
  const {
    data: { user },
  } = await oturumClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş yapmalısınız." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!restoran) {
    return NextResponse.json({ hata: "Restoran bulunamadı." }, { status: 404 });
  }

  const { error } = await supabase
    .from("rezervasyonlar")
    .update({ restoran_notu: String(not ?? "").trim() || null })
    .eq("id", id)
    .eq("restoran_id", restoran.id);

  if (error) {
    return NextResponse.json({ hata: "Not kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ basari: true });
}
