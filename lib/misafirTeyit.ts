import { createHmac, timingSafeEqual } from "crypto";

// Misafirin "geldim/gelmedim" teyidi girişsiz, tek tıkla çalışsın diye
// imzalı bir token kullanıyoruz: login gerektirmeden ama tahmin edilemez.
// Token = HMAC(rezervasyonId + cevap), tüm hesaplama sunucuda tekrarlanıp
// zamana karşı güvenli şekilde (timingSafeEqual) karşılaştırılır.

function gizliAnahtar() {
  const anahtar = process.env.MISAFIR_TEYIT_GIZLI_ANAHTAR;
  if (!anahtar) {
    throw new Error("MISAFIR_TEYIT_GIZLI_ANAHTAR tanımlı değil.");
  }
  return anahtar;
}

export type TeyitCevabi = "evet" | "hayir";

export function teyitTokenUret(rezervasyonId: string, cevap: TeyitCevabi): string {
  return createHmac("sha256", gizliAnahtar())
    .update(`${rezervasyonId}:${cevap}`)
    .digest("hex");
}

export function teyitTokenDogrula(
  rezervasyonId: string,
  cevap: string,
  token: string
): cevap is TeyitCevabi {
  if (cevap !== "evet" && cevap !== "hayir") return false;
  const beklenen = Buffer.from(teyitTokenUret(rezervasyonId, cevap), "hex");
  const gelen = Buffer.from(String(token ?? ""), "hex");
  if (beklenen.length !== gelen.length) return false;
  return timingSafeEqual(beklenen, gelen);
}

export function teyitLinkUret(rezervasyonId: string, cevap: TeyitCevabi): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com").replace(/\/$/, "");
  const token = teyitTokenUret(rezervasyonId, cevap);
  return `${siteUrl}/api/rezervasyon/${rezervasyonId}/misafir-teyit?cevap=${cevap}&token=${token}`;
}

/** WhatsApp URL butonları için kısa kod: "<rezervasyonId>.<e|h>.<token>" — buton
 *  şablonunda sabit taban "https://www.masadaki.com/teyit/{{1}}" olduğu için
 *  yalnızca bu son ek değişken olarak gönderilir. */
export function teyitKisaKod(rezervasyonId: string, cevap: TeyitCevabi): string {
  return `${rezervasyonId}.${cevap === "evet" ? "e" : "h"}.${teyitTokenUret(rezervasyonId, cevap)}`;
}

export function teyitKisaKodCoz(kod: string): { id: string; cevap: TeyitCevabi; token: string } | null {
  const [id, harf, token] = kod.split(".");
  if (!id || !token || (harf !== "e" && harf !== "h")) return null;
  return { id, cevap: harf === "e" ? "evet" : "hayir", token };
}
