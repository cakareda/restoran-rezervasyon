const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";
const MARKA = "#7a1f2b";
const ARKA_PLAN = "#f5f1ea";

function tarihSaatFormatla(tarihSaatIso: string) {
  return new Date(tarihSaatIso).toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

/** Tüm e-postaları saran ortak, logolu ve markalı kabuk. Tablo tabanlı düzen
 *  Outlook dahil e-posta istemcilerinde daha güvenilir render olur. */
function epostaSarmalayici(params: { ustEtiket?: string; icerikHtml: string }) {
  const { ustEtiket, icerikHtml } = params;
  return `
<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:0;background:${ARKA_PLAN};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ARKA_PLAN};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#ffffff;padding:20px 28px;border-bottom:3px solid ${MARKA};" align="left">
                <img
                  src="${SITE_URL}/masadaki-logo.png"
                  alt="Masadaki"
                  width="112"
                  height="32"
                  style="display:block;width:112px;height:32px;border:0;"
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
      icerikHtml: `
        ${baslik("Yeni bir rezervasyon talebiniz var")}
        <p style="margin:0;">${params.restoranAd} için yeni bir rezervasyon talebi geldi.</p>
        ${detayListesi([
          `<strong>Misafir:</strong> ${params.misafirAd}`,
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
        ${buton(params.panelUrl, "Panelde görüntüle")}
      `,
    }),
  };
}

export function onayEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  iptalUrl?: string;
  degistirUrl?: string;
}) {
  return {
    konu: `Rezervasyonunuz onaylandı — ${params.restoranAd}`,
    html: epostaSarmalayici({
      icerikHtml: `
        ${baslik("Rezervasyonunuz onaylandı")}
        <p style="margin:0;"><strong>${params.restoranAd}</strong> rezervasyon talebinizi onayladı.</p>
        ${detayListesi([
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
        <p style="margin:0;">Sizi ağırlamaktan mutluluk duyacaklar. Afiyet olsun!</p>
        ${
          params.iptalUrl || params.degistirUrl
            ? `<p style="margin-top:20px;font-size:13px;color:#6b7280;">
                Planların değişti mi?
                ${params.degistirUrl ? `<a href="${params.degistirUrl}" style="color:${MARKA};">Tarihi değiştir</a>` : ""}
                ${params.iptalUrl && params.degistirUrl ? " · " : ""}
                ${params.iptalUrl ? `<a href="${params.iptalUrl}" style="color:#dc2626;">Rezervasyonu iptal et</a>` : ""}
              </p>`
            : ""
        }
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
      icerikHtml: `
        ${baslik("Bir rezervasyon iptal edildi")}
        <p style="margin:0;"><strong>${params.misafirAd}</strong>, aşağıdaki rezervasyonunu iptal etti.</p>
        ${detayListesi([
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
      `,
    }),
  };
}

export function misafirIptalOnayEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
}) {
  return {
    konu: `Rezervasyonunuz iptal edildi — ${params.restoranAd}`,
    html: epostaSarmalayici({
      icerikHtml: `
        ${baslik("İptaliniz alındı")}
        <p style="margin:0;"><strong>${params.restoranAd}</strong> için ${tarihSaatFormatla(
          params.tarihSaat
        )} tarihli rezervasyonunuzu iptal ettiniz.</p>
        ${detayListesi([`<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`])}
        <p style="margin:0;">Görüşmek üzere!</p>
      `,
    }),
  };
}

export function redEpostasi(params: { restoranAd: string; tarihSaat: string }) {
  return {
    konu: `Rezervasyon talebiniz için güncelleme — ${params.restoranAd}`,
    html: epostaSarmalayici({
      icerikHtml: `
        ${baslik("Talebiniz bu saat için onaylanamadı")}
        <p style="margin:0;"><strong>${params.restoranAd}</strong>, ${tarihSaatFormatla(
          params.tarihSaat
        )} için talebinizi bu sefer onaylayamadı.</p>
        <p style="margin:12px 0 0 0;">Farklı bir tarih/saat seçerek tekrar deneyebilirsiniz.</p>
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
}) {
  return {
    konu: `Hatırlatma: Bugün ${params.restoranAd}'da yer ayırttınız`,
    html: epostaSarmalayici({
      ustEtiket: "Masadaki'den otomatik hatırlatma",
      icerikHtml: `
        ${baslik("Rezervasyonunuz yaklaşıyor")}
        <p style="margin:0;"><strong>${params.restoranAd}</strong>'da yeriniz hazır olacak.</p>
        ${detayListesi([
          `<strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}`,
          `<strong>Kişi Sayısı:</strong> ${params.kisiSayisi}`,
        ])}
        <p style="margin:0;">Afiyet olsun!</p>
        ${
          params.iptalUrl || params.degistirUrl
            ? `<p style="margin-top:20px;font-size:13px;color:#6b7280;">
                Gelemeyecek misiniz?
                ${params.degistirUrl ? `<a href="${params.degistirUrl}" style="color:${MARKA};">Tarihi değiştir</a>` : ""}
                ${params.iptalUrl && params.degistirUrl ? " · " : ""}
                ${params.iptalUrl ? `<a href="${params.iptalUrl}" style="color:#dc2626;">Rezervasyonu iptal et</a>` : ""}
              </p>`
            : ""
        }
      `,
    }),
  };
}

export function yorumDavetiEpostasi(params: { restoranAd: string; yorumUrl: string }) {
  return {
    konu: `${params.restoranAd} deneyiminizi puanlayın`,
    html: epostaSarmalayici({
      icerikHtml: `
        ${baslik("Nasıl geçti?")}
        <p style="margin:0;"><strong>${params.restoranAd}</strong>'daki deneyiminizi diğer misafirlerle paylaşmak ister misiniz?</p>
        ${buton(params.yorumUrl, "Yorum bırak")}
      `,
    }),
  };
}
