import { resend, GONDEREN_EPOSTA } from "./resend";
import { hataBildir } from "@/lib/sistemIzleme";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function bildirimGonderVeKaydet(params: {
  rezervasyonId: string;
  aliciEposta: string;
  tur:
    | "yeni_talep"
    | "onay"
    | "red"
    | "yorum_daveti"
    | "musteri_iptali"
    | "hatirlatma"
    | "restoran_iptali"
    | "gelis_teyidi";
  konu: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: GONDEREN_EPOSTA,
    to: params.aliciEposta,
    subject: params.konu,
    html: params.html,
  });

  if (error) {
    console.error("[Resend gönderim hatası]", error);
    await hataBildir("eposta:gonderim", error.message);
    return;
  }

  const supabase = createServiceRoleClient();
  await supabase.from("bildirimler").insert({
    rezervasyon_id: params.rezervasyonId,
    kanal: "eposta",
    tur: params.tur,
  });
}
