import { EPOSTA_CEVIRILERI, EPOSTA_LOCALE_MAP, epostaDiliCoz, type EpostaDili } from "./ceviriler";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";
const MARKA = "#7a1f2b";
const ARKA_PLAN = "#f5f1ea";

function tarihSaatFormatla(tarihSaatIso: string, dil: EpostaDili) {
  return new Date(tarihSaatIso).toLocaleString(EPOSTA_LOCALE_MAP[dil], {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

/** Tüm e-postaları saran ortak, logolu ve markalı kabuk. Tablo tabanlı düzen
 *  Outlook dahil e-posta istemcilerinde daha güvenilir render olur. */
function epostaSarmalayici(params: { ustEtiket?: string; icerikHtml: string; dil: EpostaDili }) {
  const { ustEtiket, icerikHtml, dil } = params;
  const rtl = dil === "ar";
  return `
<!DOCTYPE html>
<html lang="${dil}" dir="${rtl ? "rtl" : "ltr"}">
  <body style="margin:0;padding:0;background:${ARKA_PLAN};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ARKA_PLAN};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);" dir="${rtl ? "rtl" : "ltr"}">
            <tr>
              <td style="background:#ffffff;padding:20px 28px;border-bottom:3px solid ${MARKA};" align="${rtl ? "right" : "left"}">
                <img
                  src="${SITE_URL}/masadaki-logo.png"
                  alt="Masadaki"
                  width="175"
                  height="50"
                  style="display:block;width:175px;height:50px;border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 12px 28px;">
                ${
                  ustEtiket
                    ? `<p style="margin:0 0 12px 0;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">${ustEtiket}</p>`
                    : ""
                }
                <div style="color:#1f2937;font-size:15px;line-height:1.6;">
                  ${icerikHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px 28px;border-top:1px solid #f0ece3;margin-top:12px;">
                <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">
                  Masadaki · <a href="mailto:info@masadaki.com" style="color:#9ca3af;">info@masadaki.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function baslik(metin: string) {
  return `<h2 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#1f2937;">${metin}</h2>`;
}

function detayListesi(satirlar: string[]) {
  return `<ul style="margin:16px 0;padding:0;list-style:none;">
    ${satirlar
      .map(
        (s) =>
          `<li style="padding:8px 0;border-bottom:1px solid #f0ece3;font-size:14px;">${s}</li>`
      )
      .join("")}
  </ul>`;
}

function buton(href: string, metin: string, renk = MARKA) {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:11px 20px;background:${renk};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">${metin}</a>`;
}

/** Restorana giden bildirimler (yeni talep, misafirin iptali) her zaman Türkçe —
 *  restoran sahipleri Türkiye'de, panel de Türkçe. */
export function yeniTalepEpostasi(params: {
  restoranAd: string;
  misafirAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  panelUrl: string;
}) {
  return {
    konu: `Yeni rezervasyon talebi — ${params.misafirAd}`,
    html: epostaSarmalayici({
      dil: "tr",
      icerikHtml: `
        ${baslik("Yeni bir rezervasyon talebiniz var")}
        <p style="margin:0;">${params.restoranAd} için yeni bir rezervasyon talebi geldi.</p>
        ${detayListesi([
          `<strong>Misafir:</strong> ${params.misafirAd}`,
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat, "tr")}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
        ${buton(params.panelUrl, "Panelde görüntüle")}
      `,
    }),
  };
}

export function musteriIptalEpostasi(params: {
  misafirAd: string;
  tarihSaat: string;
  kisiSayisi: number;
}) {
  return {
    konu: `Rezervasyon iptal edildi — ${params.misafirAd}`,
    html: epostaSarmalayici({
      dil: "tr",
      icerikHtml: `
        ${baslik("Bir rezervasyon iptal edildi")}
        <p style="margin:0;"><strong>${params.misafirAd}</strong>, aşağıdaki rezervasyonunu iptal etti.</p>
        ${detayListesi([
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat, "tr")}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
      `,
    }),
  };
}

// --- Aşağıdaki şablonlar misafire gider, misafirin kayıtlı dilinde (misafir_dili) gönderilir. ---

export function onayEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  iptalUrl?: string;
  degistirUrl?: string;
  dil?: string | null;
}) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.onayKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      icerikHtml: `
        ${baslik(c.onayBaslik)}
        <p style="margin:0;">${c.onayP1(params.restoranAd)}</p>
        ${detayListesi([
          `<strong>${c.tarihSaatEtiketi}:</strong> ${tarihSaatFormatla(params.tarihSaat, dil)}`,
          `<strong>${c.kisiSayisiEtiketi}:</strong> ${params.kisiSayisi}`,
        ])}
        <p style="margin:0;">${c.onayNot} ${c.afiyetOlsun}</p>
        ${
          params.iptalUrl || params.degistirUrl
            ? `<p style="margin-top:20px;font-size:13px;color:#6b7280;">
                ${c.planlarDegistiMi}
                ${params.degistirUrl ? `<a href="${params.degistirUrl}" style="color:${MARKA};">${c.tarihiDegistir}</a>` : ""}
                ${params.iptalUrl && params.degistirUrl ? " · " : ""}
                ${params.iptalUrl ? `<a href="${params.iptalUrl}" style="color:#dc2626;">${c.rezervasyonuIptalEt}</a>` : ""}
              </p>`
            : ""
        }
      `,
    }),
  };
}

export function misafirIptalOnayEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  dil?: string | null;
}) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.misafirIptalKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      icerikHtml: `
        ${baslik(c.misafirIptalBaslik)}
        <p style="margin:0;">${c.misafirIptalP1(params.restoranAd, tarihSaatFormatla(params.tarihSaat, dil))}</p>
        ${detayListesi([`<strong>${c.kisiSayisiEtiketi}:</strong> ${params.kisiSayisi}`])}
        <p style="margin:0;">${c.gorusmekUzere}</p>
      `,
    }),
  };
}

export function redEpostasi(params: { restoranAd: string; tarihSaat: string; dil?: string | null }) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.retKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      icerikHtml: `
        ${baslik(c.retBaslik)}
        <p style="margin:0;">${c.retP1(params.restoranAd, tarihSaatFormatla(params.tarihSaat, dil))}</p>
        <p style="margin:12px 0 0 0;">${c.retP2}</p>
      `,
    }),
  };
}

export function hatirlatmaEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  iptalUrl?: string;
  degistirUrl?: string;
  dil?: string | null;
}) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.hatirlatmaKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      ustEtiket: c.hatirlatmaUstEtiket,
      icerikHtml: `
        ${baslik(c.hatirlatmaBaslik)}
        <p style="margin:0;">${c.hatirlatmaP1(params.restoranAd)}</p>
        ${detayListesi([
          `<strong>${c.tarihSaatEtiketi}:</strong> ${tarihSaatFormatla(params.tarihSaat, dil)}`,
          `<strong>${c.kisiSayisiEtiketi}:</strong> ${params.kisiSayisi}`,
        ])}
        <p style="margin:0;">${c.afiyetOlsun}</p>
        ${
          params.iptalUrl || params.degistirUrl
            ? `<p style="margin-top:20px;font-size:13px;color:#6b7280;">
                ${c.gelemeyecekMisiniz}
                ${params.degistirUrl ? `<a href="${params.degistirUrl}" style="color:${MARKA};">${c.tarihiDegistir}</a>` : ""}
                ${params.iptalUrl && params.degistirUrl ? " · " : ""}
                ${params.iptalUrl ? `<a href="${params.iptalUrl}" style="color:#dc2626;">${c.rezervasyonuIptalEt}</a>` : ""}
              </p>`
            : ""
        }
      `,
    }),
  };
}

export function restoranIptalEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  dil?: string | null;
}) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.restoranIptalKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      icerikHtml: `
        ${baslik(c.restoranIptalBaslik)}
        <p style="margin:0;">${c.restoranIptalP1(params.restoranAd, tarihSaatFormatla(params.tarihSaat, dil))}</p>
        ${detayListesi([`<strong>${c.kisiSayisiEtiketi}:</strong> ${params.kisiSayisi}`])}
        <p style="margin:0;">${c.restoranIptalP2}</p>
      `,
    }),
  };
}

export function yorumDavetiEpostasi(params: { restoranAd: string; yorumUrl: string; dil?: string | null }) {
  const dil = epostaDiliCoz(params.dil);
  const c = EPOSTA_CEVIRILERI[dil];
  return {
    konu: c.yorumKonu(params.restoranAd),
    html: epostaSarmalayici({
      dil,
      icerikHtml: `
        ${baslik(c.yorumBaslik)}
        <p style="margin:0;">${c.yorumP1(params.restoranAd)}</p>
        ${buton(params.yorumUrl, c.yorumButon)}
      `,
    }),
  };
}
