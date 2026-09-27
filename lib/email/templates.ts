function tarihSaatFormatla(tarihSaatIso: string) {
  return new Date(tarihSaatIso).toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

const kutuStil =
  "font-family: -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;";

export function yeniTalepEpostasi(params: {
  restoranAd: string;
  misafirAd: string;
  tarihSaat: string;
  kisiSayisi: number;
  panelUrl: string;
}) {
  return {
    konu: `Yeni rezervasyon talebi — ${params.misafirAd}`,
    html: `
      <div style="${kutuStil}">
        <h2>Yeni bir rezervasyon talebiniz var</h2>
        <p><strong>${params.restoranAd}</strong> için yeni bir rezervasyon talebi geldi.</p>
        <ul>
          <li><strong>Misafir:</strong> ${params.misafirAd}</li>
          <li><strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}</li>
          <li><strong>Kişi Sayısı:</strong> ${params.kisiSayisi}</li>
        </ul>
        <p><a href="${params.panelUrl}" style="color:#2563eb;">Talebi görüntülemek ve yanıtlamak için panele gidin</a></p>
      </div>
    `,
  };
}

export function onayEpostasi(params: {
  restoranAd: string;
  tarihSaat: string;
  kisiSayisi: number;
}) {
  return {
    konu: `Rezervasyonunuz onaylandı — ${params.restoranAd}`,
    html: `
      <div style="${kutuStil}">
        <h2>Rezervasyonunuz onaylandı</h2>
        <p><strong>${params.restoranAd}</strong> rezervasyon talebinizi onayladı.</p>
        <ul>
          <li><strong>Tarih/Saat:</strong> ${tarihSaatFormatla(params.tarihSaat)}</li>
          <li><strong>Kişi Sayısı:</strong> ${params.kisiSayisi}</li>
        </ul>
        <p>Sizi ağırlamaktan mutluluk duyacaklar. İyi yemekler!</p>
      </div>
    `,
  };
}

export function redEpostasi(params: { restoranAd: string; tarihSaat: string }) {
  return {
    konu: `Rezervasyon talebiniz için güncelleme — ${params.restoranAd}`,
    html: `
      <div style="${kutuStil}">
        <h2>Talebiniz bu saat için onaylanamadı</h2>
        <p><strong>${params.restoranAd}</strong>, ${tarihSaatFormatla(
      params.tarihSaat
    )} için talebinizi bu sefer onaylayamadı.</p>
        <p>Farklı bir tarih/saat seçerek tekrar deneyebilirsiniz.</p>
      </div>
    `,
  };
}

export function yorumDavetiEpostasi(params: {
  restoranAd: string;
  yorumUrl: string;
}) {
  return {
    konu: `${params.restoranAd} deneyiminizi puanlayın`,
    html: `
      <div style="${kutuStil}">
        <h2>Nasıl geçti?</h2>
        <p><strong>${params.restoranAd}</strong>'daki deneyiminizi diğer misafirlerle paylaşmak ister misiniz?</p>
        <p><a href="${params.yorumUrl}" style="color:#2563eb;">Yorum bırak</a></p>
      </div>
    `,
  };
}
