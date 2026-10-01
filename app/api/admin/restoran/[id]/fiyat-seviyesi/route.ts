import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminMi } from "@/lib/admin";

export async function PATCH(
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

  const { fiyatSeviyesi } = await request.json();
  if (![1, 2, 3, 4].includes(Number(fiyatSeviyesi))) {
    return NextResponse.json({ hata: "Geçersiz fiyat seviyesi." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("restoranlar")
    .update({ fiyat_seviyesi: Number(fiyatSeviyesi) })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ basari: true });
}
