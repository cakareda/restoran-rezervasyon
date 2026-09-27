import { resend, GONDEREN_EPOSTA } from "./resend";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function bildirimGonderVeKaydet(params: {
  rezervasyonId: string;
  aliciEposta: string;
  tur: "yeni_talep" | "onay" | "red" | "yorum_daveti" | "musteri_iptali";
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
    return;
  }

  const supabase = createServiceRoleClient();
  await supabase.from("bildirimler").insert({
    rezervasyon_id: params.rezervasyonId,
    kanal: "eposta",
    tur: params.tur,
  });
}
