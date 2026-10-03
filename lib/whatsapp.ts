import { whatsappNumarasi } from "@/lib/format";
import { epostaDiliCoz, EPOSTA_LOCALE_MAP, type EpostaDili } from "@/lib/email/ceviriler";

// WhatsApp Business Cloud API (Meta) ile şablon mesajı gönderir.
// İşletme tarafından başlatılan mesajlar yalnızca ONAYLI ŞABLONLARLA gönderilebilir;
// şablonlar Meta Business Manager'da oluşturulup onaylatılmalı (bkz. README / sohbet notu).
//
// Ortam değişkenleri: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, (ops.) WHATSAPP_API_VERSION.
// Tanımlı değilse gönderim "yapılandırılmamış" döner ve çağıran taraf e-postaya düşer.

export type WhatsappSonuc = { gonderildi: boolean; neden?: string };

export function whatsappHazirMi() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Misafirin rezervasyon dili (8 dil) → WhatsApp şablon dil kodu. Bilinmeyen dil Türkçeye düşer. */
export function whatsappSablonDili(dil: string | null | undefined): EpostaDili {
  return epostaDiliCoz(dil);
}

/** Tarihi misafirin dilinde, İstanbul saatiyle biçimler (şablon değişkeni için). */
export function whatsappTarihMetni(tarihSaat: string, dil: EpostaDili): string {
  return new Date(tarihSaat).toLocaleString(EPOSTA_LOCALE_MAP[dil], {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

export async function whatsappSablonGonder(params: {
  telefon: string | null | undefined;
  sablon: string;
  dil: EpostaDili;
  govdeDegiskenleri: string[];
  /** Sırayla her URL butonunun dinamik son eki (ör. kısa teyit kodu). */
  butonEkleri?: string[];
}): Promise<WhatsappSonuc> {
  if (!whatsappHazirMi()) return { gonderildi: false, neden: "yapilandirilmamis" };
  if (!params.telefon) return { gonderildi: false, neden: "telefon_yok" };

  const numara = whatsappNumarasi(params.telefon);
  if (numara.length < 10) return { gonderildi: false, neden: "gecersiz_telefon" };

  const surum = process.env.WHATSAPP_API_VERSION || "v21.0";
  const components: unknown[] = [
    {
      type: "body",
      parameters: params.govdeDegiskenleri.map((text) => ({ type: "text", text })),
    },
    ...(params.butonEkleri ?? []).map((ek, index) => ({
      type: "button",
      sub_type: "url",
      index: String(index),
      parameters: [{ type: "text", text: ek }],
    })),
  ];

  // Seçilen dilde onaylı şablon yoksa (Meta 400 döner) İngilizce sürüme düş.
  const denenecekDiller: EpostaDili[] = params.dil === "en" ? ["en"] : [params.dil, "en"];

  for (const dil of denenecekDiller) {
    try {
      const yanit = await fetch(
        `https://graph.facebook.com/${surum}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: numara,
            type: "template",
            template: { name: params.sablon, language: { code: dil }, components },
          }),
        }
      );
      if (yanit.ok) return { gonderildi: true };
      const govde = await yanit.text();
      console.error("[WhatsApp gönderim hatası]", dil, yanit.status, govde.slice(0, 300));
      if (yanit.status !== 400) return { gonderildi: false, neden: `http_${yanit.status}` };
    } catch (e) {
      console.error("[WhatsApp gönderim hatası]", e);
      return { gonderildi: false, neden: "ag_hatasi" };
    }
  }
  return { gonderildi: false, neden: "sablon_bulunamadi" };
}
