import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resend, GONDEREN_EPOSTA } from "@/lib/email/resend";
import { telefonGecerliMi } from "@/lib/telefon";

function kac(deger: unknown) {
  return String(deger ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const body = await request.json();
  const { restoranAdi, eposta, telefon, masaDuzeni, menu } = body;

  if (!restoranAdi || !eposta || !telefon) {
    return NextResponse.json(
      { hata: "Restoran adı, e-posta ve telefon zorunlu." },
      { status: 400 }
    );
  }

  if (!telefonGecerliMi(telefon)) {
    return NextResponse.json({ hata: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("basvurular").insert({
    restoran_adi: String(restoranAdi).slice(0, 100),
    eposta: String(eposta).slice(0, 200),
    telefon: telefon ? String(telefon) : null,
    masa_duzeni: masaDuzeni ? String(masaDuzeni).slice(0, 1000) : null,
    menu: menu ? String(menu).slice(0, 1000) : null,
  });

  if (error) {
    return NextResponse.json({ hata: "Başvuru kaydedilemedi, tekrar deneyin." }, { status: 500 });
  }

  // Bildirim e-postası iyi niyet çabasıdır (best-effort) — başarısız olsa da
  // başvuru zaten veritabanına kaydedildiği için misafire hata dönmüyoruz.
  try {
    await resend.emails.send({
      from: GONDEREN_EPOSTA,
      to: "info@masadaki.com",
      subject: `Yeni restoran başvurusu: ${String(restoranAdi).replace(/[\r\n]/g, " ").slice(0, 100)}`,
      html: `
        <p><strong>Restoran:</strong> ${kac(restoranAdi)}</p>
        <p><strong>E-posta:</strong> ${kac(eposta)}</p>
        <p><strong>Telefon:</strong> ${kac(telefon) || "—"}</p>
        <p><strong>Masa düzeni:</strong><br/>${masaDuzeni ? kac(String(masaDuzeni).slice(0, 1000)).replace(/\n/g, "<br/>") : "—"}</p>
        <p><strong>Menü:</strong><br/>${menu ? kac(String(menu).slice(0, 1000)).replace(/\n/g, "<br/>") : "—"}</p>
      `,
    });
  } catch (e) {
    console.error("[Başvuru bildirim e-postası gönderilemedi]", e);
  }

  return NextResponse.json({ basarili: true });
}
