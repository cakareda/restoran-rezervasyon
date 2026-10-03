import { NextResponse } from "next/server";
import { teyitKisaKodCoz } from "@/lib/misafirTeyit";

// WhatsApp butonlarındaki kısa link: /teyit/<id>.<e|h>.<token>
// Asıl iş /api/rezervasyon/[id]/misafir-teyit uç noktasında yapılıyor.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kod: string }> }
) {
  const { kod } = await params;
  const cozulen = teyitKisaKodCoz(decodeURIComponent(kod));
  if (!cozulen) {
    return new NextResponse("Geçersiz bağlantı.", { status: 400 });
  }
  const hedef = new URL(`/api/rezervasyon/${cozulen.id}/misafir-teyit`, request.url);
  hedef.searchParams.set("cevap", cozulen.cevap);
  hedef.searchParams.set("token", cozulen.token);
  return NextResponse.redirect(hedef);
}
