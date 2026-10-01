import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fiyatSeviyesi } from "@/lib/format";

// Aylık komisyon raporu — MANUEL faturalama akışı için.
// Otomatik kart tahsilatı YOK: şirket/vergi yapısı netleşmeden otomatik ödeme
// altyapısı kurmak hem hukuki hem teknik riski büyütür. Bu uç nokta sadece
// "bu ay kime ne kadar fatura keseceğim" sorusunun cevabını üretir; faturayı
// (e-arşiv/e-fatura) ve tahsilatı (havale/EFT) hâlâ sen/muhasebeci yapıyor.
//
// Kullanım: /api/admin/komisyon-raporu?ay=2026-10&anahtar=...  (HTML tablo)
//           &format=json ekleyerek ham veri alınabilir.
//
// "anahtar", panelde login olmadan (henüz admin paneli yok) korumak için
// basit bir paylaşılan sır — ADMIN_RAPOR_ANAHTARI ortam değişkeninde tutulur.

const KADEME_TUTARLARI: Record<1 | 2 | 3 | 4, number> = { 1: 15, 2: 20, 3: 30, 4: 39 };
const UCRETSIZ_DONEM_AY = 6;

type RestoranSatir = {
  restoranId: string;
  restoranAd: string;
  restoranEposta: string;
  ucretsizDonemBitisi: string;
  gelenMisafirSayisi: number;
  itirazliSayisi: number;
  teyitBeklenenSayisi: number;
  toplamTutar: number;
};

function ayAraligi(ayParam: string | null): { baslangic: Date; bitis: Date; etiket: string } {
  const simdi = new Date();
  const [yilStr, ayStr] = (ayParam ?? "").split("-");
  const yil = Number(yilStr) || simdi.getUTCFullYear();
  const ay = Number(ayStr) || simdi.getUTCMonth() + 1;
  const baslangic = new Date(Date.UTC(yil, ay - 1, 1));
  const bitis = new Date(Date.UTC(yil, ay, 1));
  return { baslangic, bitis, etiket: `${yil}-${String(ay).padStart(2, "0")}` };
}

function tabloHtml(satirlar: RestoranSatir[], ayEtiketi: string) {
  const genelToplam = satirlar.reduce((t, s) => t + s.toplamTutar, 0);
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" />
<title>Komisyon Raporu — ${ayEtiketi}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; max-width: 1000px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f5f1ea; }
  .sayi { text-align: right; }
  .uyari { color: #b91c1c; font-weight: 600; }
  .muaf { color: #9ca3af; }
</style></head>
<body>
  <h1>Komisyon Raporu — ${ayEtiketi}</h1>
  <p>Yalnızca Masadaki kaynaklı (kaynak=online), gerçekten gelmiş (geldi_mi=true) ve misafir tarafından reddedilmemiş (misafir_teyit≠false) rezervasyonlar sayılır. Restoranın kendi eklediği (telefon/walk-in) rezervasyonlar hiç dahil değil. Ücretsiz dönemi (6 ay) bitmemiş restoranlar 0 TL görünür.</p>
  <table>
    <thead><tr>
      <th>Restoran</th><th>E-posta</th><th>Ücretsiz dönem bitişi</th>
      <th class="sayi">Gelen misafir</th><th class="sayi">İtirazlı (hariç)</th><th class="sayi">Yanıt bekleyen</th>
      <th class="sayi">Tutar (TL)</th>
    </tr></thead>
    <tbody>
      ${satirlar
        .map(
          (s) => `<tr>
        <td>${s.restoranAd}</td>
        <td>${s.restoranEposta}</td>
        <td>${new Date(s.ucretsizDonemBitisi).toLocaleDateString("tr-TR")}</td>
        <td class="sayi">${s.gelenMisafirSayisi}</td>
        <td class="sayi ${s.itirazliSayisi > 0 ? "uyari" : ""}">${s.itirazliSayisi}</td>
        <td class="sayi">${s.teyitBeklenenSayisi}</td>
        <td class="sayi ${s.toplamTutar === 0 ? "muaf" : ""}">${s.toplamTutar.toLocaleString("tr-TR")}</td>
      </tr>`
        )
        .join("")}
    </tbody>
    <tfoot><tr><th colspan="6">Genel toplam</th><th class="sayi">${genelToplam.toLocaleString("tr-TR")} TL</th></tr></tfoot>
  </table>
</body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const anahtar = url.searchParams.get("anahtar");
  if (!process.env.ADMIN_RAPOR_ANAHTARI || anahtar !== process.env.ADMIN_RAPOR_ANAHTARI) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  const { baslangic, bitis, etiket } = ayAraligi(url.searchParams.get("ay"));
  const supabase = createServiceRoleClient();

  const { data: restoranlar, error: restoranHata } = await supabase
    .from("restoranlar")
    .select("id, ad, eposta, olusturulma, fiyat_seviyesi, ortalama_fiyat");
  if (restoranHata) {
    return NextResponse.json({ hata: "Restoranlar okunamadı." }, { status: 500 });
  }

  const { data: rezervasyonlar, error: rezHata } = await supabase
    .from("rezervasyonlar")
    .select("restoran_id, tarih_saat, misafir_teyit")
    .eq("kaynak", "online")
    .eq("geldi_mi", true)
    .gte("tarih_saat", baslangic.toISOString())
    .lt("tarih_saat", bitis.toISOString());
  if (rezHata) {
    return NextResponse.json({ hata: "Rezervasyonlar okunamadı." }, { status: 500 });
  }

  const satirlar: RestoranSatir[] = (restoranlar ?? []).map((r) => {
    const ucretsizDonemBitisi = new Date(r.olusturulma);
    ucretsizDonemBitisi.setUTCMonth(ucretsizDonemBitisi.getUTCMonth() + UCRETSIZ_DONEM_AY);

    const buRestoranin = (rezervasyonlar ?? []).filter((rz) => rz.restoran_id === r.id);
    const ucretliDonemde = buRestoranin.filter(
      (rz) => new Date(rz.tarih_saat).getTime() >= ucretsizDonemBitisi.getTime()
    );

    const gelen = ucretliDonemde.filter((rz) => rz.misafir_teyit !== false);
    const itirazli = ucretliDonemde.filter((rz) => rz.misafir_teyit === false);
    const teyitBekleyen = gelen.filter((rz) => rz.misafir_teyit === null);

    const seviye = fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi) ?? 1;
    const tutar = gelen.length * KADEME_TUTARLARI[seviye];

    return {
      restoranId: r.id,
      restoranAd: r.ad,
      restoranEposta: r.eposta,
      ucretsizDonemBitisi: ucretsizDonemBitisi.toISOString(),
      gelenMisafirSayisi: gelen.length,
      itirazliSayisi: itirazli.length,
      teyitBeklenenSayisi: teyitBekleyen.length,
      toplamTutar: tutar,
    };
  });

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ ay: etiket, restoranlar: satirlar });
  }

  return new NextResponse(tabloHtml(satirlar, etiket), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
