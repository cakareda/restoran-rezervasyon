import { NextResponse } from "next/server";
import { komisyonRaporuHesapla, type KomisyonSatiri } from "@/lib/komisyonRaporu";

// Aylık komisyon raporu — MANUEL faturalama akışı için.
// Otomatik kart tahsilatı YOK: şirket/vergi yapısı netleşmeden otomatik ödeme
// altyapısı kurmak hem hukuki hem teknik riski büyütür. Bu uç nokta sadece
// "bu ay kime ne kadar fatura keseceğim" sorusunun cevabını üretir; faturayı
// (e-arşiv/e-fatura) ve tahsilatı (havale/EFT) hâlâ sen/muhasebeci yapıyor.
//
// Hesaplama mantığı lib/komisyonRaporu.ts'te — admin panelindeki
// /admin/komisyon-raporu sayfası da aynı fonksiyonu kullanıyor.
//
// Kullanım: /api/admin/komisyon-raporu?ay=2026-10&anahtar=...  (HTML tablo)
//           &format=json ekleyerek ham veri alınabilir.
//
// Bu uç nokta URL'deki paylaşılan anahtarla korunuyor (ADMIN_RAPOR_ANAHTARI) —
// panel dışından (ör. muhasebeciyle link paylaşmak için) erişim gerekirse diye
// ayrıca duruyor. Panel içi kullanım için /admin/komisyon-raporu'nu tercih et.

function tabloHtml(satirlar: KomisyonSatiri[], ayEtiketi: string, bekleyenToplam: number) {
  const genelToplam = satirlar.reduce((t, s) => t + s.toplamTutar, 0);
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" />
<title>Komisyon Raporu — ${ayEtiketi}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; max-width: 1100px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f5f1ea; }
  .sayi { text-align: right; }
  .uyari { color: #b91c1c; font-weight: 600; }
  .muaf { color: #9ca3af; }
  .not { color: #6b7280; font-size: 13px; }
</style></head>
<body>
  <h1>Komisyon Raporu — ${ayEtiketi}</h1>
  <p>Sözleşme V1.0: Masadaki kaynaklı, onaylı, iptal/No-Show olmayan rezervasyonlar ücretlidir (kişi sayısı × segment bedeli, KDV hariç). Tahakkuk: "Geldi" ise rezervasyon saati, işaret yoksa rezervasyon saati + 48 saat. Misafir uyarısı ve inceleme kayıtları bilgi amaçlıdır.</p>
  <table>
    <thead><tr>
      <th>Restoran</th><th>E-posta</th><th>Ücretsiz dönem bitişi</th>
      <th class="sayi">Ücretli rez.</th><th class="sayi">Ücretli kişi</th>
      <th class="sayi">Misafir uyarısı</th><th class="sayi">İnceleme (şüpheli No-Show)</th>
      <th class="sayi">Tutar (TL)</th>
    </tr></thead>
    <tbody>
      ${satirlar
        .map(
          (s) => `<tr>
        <td>${s.restoranAd}${s.kurucuRestoran ? " ★" : ""}</td>
        <td>${s.restoranEposta}</td>
        <td>${new Date(s.ucretsizDonemBitisi).toLocaleDateString("tr-TR")}</td>
        <td class="sayi">${s.ucretliRezervasyonSayisi}</td>
        <td class="sayi">${s.ucretliKisiSayisi}</td>
        <td class="sayi ${s.misafirUyarisiSayisi > 0 ? "uyari" : ""}">${s.misafirUyarisiSayisi}</td>
        <td class="sayi ${s.incelemeSayisi > 0 ? "uyari" : ""}">${s.incelemeSayisi}</td>
        <td class="sayi ${s.toplamTutar === 0 ? "muaf" : ""}">${s.toplamTutar.toLocaleString("tr-TR")}</td>
      </tr>`
        )
        .join("")}
    </tbody>
    <tfoot><tr><th colspan="7">Genel toplam</th><th class="sayi">${genelToplam.toLocaleString("tr-TR")} TL</th></tr></tfoot>
  </table>
  <p class="not">${bekleyenToplam} rezervasyonun tahakkuk zamanı henüz gelmedi, ilgili ayın raporunda otomatik görünecek.</p>
</body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const anahtar = url.searchParams.get("anahtar");
  if (!process.env.ADMIN_RAPOR_ANAHTARI || anahtar !== process.env.ADMIN_RAPOR_ANAHTARI) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  let sonuc;
  try {
    sonuc = await komisyonRaporuHesapla(url.searchParams.get("ay"));
  } catch {
    return NextResponse.json({ hata: "Rapor hesaplanamadı." }, { status: 500 });
  }

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ ay: sonuc.ay, restoranlar: sonuc.satirlar, bekleyen: sonuc.bekleyenToplam });
  }

  return new NextResponse(tabloHtml(sonuc.satirlar, sonuc.ay, sonuc.bekleyenToplam), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
