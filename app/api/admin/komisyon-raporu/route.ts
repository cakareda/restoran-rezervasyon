import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fiyatSeviyesi } from "@/lib/format";

// Aylık komisyon raporu — MANUEL faturalama akışı için.
// Otomatik kart tahsilatı YOK: şirket/vergi yapısı netleşmeden otomatik ödeme
// altyapısı kurmak hem hukuki hem teknik riski büyütür. Bu uç nokta sadece
// "bu ay kime ne kadar fatura keseceğim" sorusunun cevabını üretir; faturayı
// (e-arşiv/e-fatura) ve tahsilatı (havale/EFT) hâlâ sen/muhasebeci yapıyor.
//
// TAHAKKUK MANTIĞI (sözleşme Madde 6.4 ile birebir): bir rezervasyon "rezervasyon
// tarihinde" değil, "gerçekleştiği kesinleştiğinde" faturaya girer:
//   - misafir "evet" derse  -> tahakkuk anı = misafirin onay zamanı
//   - misafir "hayır" derse -> hiç tahakkuk etmez (itirazlı, 0 TL)
//   - misafir 48 saat yanıt vermezse -> tahakkuk anı = rezervasyon saati + 48 saat (sessizlikle kesinleşme)
//   - 48 saat henüz dolmadıysa -> henüz tahakkuk etmedi, bu ayın raporuna GİRMEZ,
//     tahakkuk ettiği ayın raporunda (genelde sonraki ay) otomatik çıkar.
// Bu yüzden rapor "tarih_saat ay içinde mi" değil, "tahakkuk anı ay içinde mi"
// sorusuna göre gruplanır — Eylül sonundaki bir rezervasyon sessizlikle Ekim'de
// kesinleşirse Ekim faturasına girer, Eylül'e değil.
//
// Kullanım: /api/admin/komisyon-raporu?ay=2026-10&anahtar=...  (HTML tablo)
//           &format=json ekleyerek ham veri alınabilir.
//
// "anahtar", panelde login olmadan (henüz admin paneli yok) korumak için
// basit bir paylaşılan sır — ADMIN_RAPOR_ANAHTARI ortam değişkeninde tutulur.

const KADEME_TUTARLARI: Record<1 | 2 | 3 | 4, number> = { 1: 15, 2: 20, 3: 30, 4: 39 };
const UCRETSIZ_DONEM_AY = 6;
const ITIRAZ_PENCERESI_SAAT = 48;
// Sorguyu daraltmak için makul bir güvenlik payı (48 saatten biraz fazla).
const SORGU_TAMPON_GUN = 4;

type RestoranSatir = {
  restoranId: string;
  restoranAd: string;
  restoranEposta: string;
  ucretsizDonemBitisi: string;
  kesinlesmisMisafirSayisi: number;
  itirazliSayisi: number;
  toplamTutar: number;
};

type Rezervasyon = {
  id: string;
  restoran_id: string;
  tarih_saat: string;
  misafir_teyit: boolean | null;
  misafir_teyit_zamani: string | null;
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

/** Bir rezervasyonun ne zaman (ve "evet"/"sessizlik"/"hayır" olarak) kesinleştiğini hesaplar.
 *  Henüz kesinleşmediyse (48 saat dolmadıysa) null döner — rapor bu kaydı yok sayar. */
function tahakkukDurumu(
  r: Rezervasyon,
  simdi: number
): { zaman: number; kesinlesmeSekli: "onay" | "sessizlik" | "itiraz" } | null {
  if (r.misafir_teyit === false) {
    const itirazZamani = r.misafir_teyit_zamani ? new Date(r.misafir_teyit_zamani).getTime() : simdi;
    return { zaman: itirazZamani, kesinlesmeSekli: "itiraz" };
  }
  if (r.misafir_teyit === true) {
    const onayZamani = r.misafir_teyit_zamani ? new Date(r.misafir_teyit_zamani).getTime() : simdi;
    return { zaman: onayZamani, kesinlesmeSekli: "onay" };
  }
  // misafir_teyit === null: yanıt yok, 48 saat dolmuş mu bak.
  const sessizlikZamani = new Date(r.tarih_saat).getTime() + ITIRAZ_PENCERESI_SAAT * 60 * 60 * 1000;
  if (simdi < sessizlikZamani) return null; // henüz kesinleşmedi
  return { zaman: sessizlikZamani, kesinlesmeSekli: "sessizlik" };
}

function tabloHtml(satirlar: RestoranSatir[], ayEtiketi: string, bekleyenToplam: number) {
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
  .not { color: #6b7280; font-size: 13px; }
</style></head>
<body>
  <h1>Komisyon Raporu — ${ayEtiketi}</h1>
  <p>Tahakkuk esaslı: bir rezervasyon, misafir "evet" dediğinde, "hayır" dediğinde veya 48 saat yanıt vermeyip sessizlikle kesinleştiğinde bu raporda sayılır — rezervasyon tarihi değil, <strong>kesinleşme tarihi</strong> esas alınır. Yalnızca Masadaki kaynaklı (kaynak=online), fiilen gelmiş (geldi_mi=true) ve ücretsiz dönemi bitmiş rezervasyonlar hesaba katılır. KDV hariç/dahil olduğu sözleşmede netleştirilecek, bu rapor KDV içermez.</p>
  <table>
    <thead><tr>
      <th>Restoran</th><th>E-posta</th><th>Ücretsiz dönem bitişi</th>
      <th class="sayi">Kesinleşmiş gelen misafir</th><th class="sayi">İtirazlı (hariç)</th>
      <th class="sayi">Tutar (TL)</th>
    </tr></thead>
    <tbody>
      ${satirlar
        .map(
          (s) => `<tr>
        <td>${s.restoranAd}</td>
        <td>${s.restoranEposta}</td>
        <td>${new Date(s.ucretsizDonemBitisi).toLocaleDateString("tr-TR")}</td>
        <td class="sayi">${s.kesinlesmisMisafirSayisi}</td>
        <td class="sayi ${s.itirazliSayisi > 0 ? "uyari" : ""}">${s.itirazliSayisi}</td>
        <td class="sayi ${s.toplamTutar === 0 ? "muaf" : ""}">${s.toplamTutar.toLocaleString("tr-TR")}</td>
      </tr>`
        )
        .join("")}
    </tbody>
    <tfoot><tr><th colspan="5">Genel toplam</th><th class="sayi">${genelToplam.toLocaleString("tr-TR")} TL</th></tr></tfoot>
  </table>
  <p class="not">${bekleyenToplam} rezervasyon henüz 48 saatlik itiraz penceresini doldurmadı, bu yüzden bu ayın raporuna dahil edilmedi — kesinleştiği ayın raporunda otomatik görünecek.</p>
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

  // 48 saatlik sessizlik penceresi yüzünden, tahakkuk tarihi rezervasyon
  // tarihinden en fazla ~2 gün sonra olabilir; sorguyu her iki yöne tamponluyoruz.
  const sorguBaslangic = new Date(baslangic.getTime() - SORGU_TAMPON_GUN * 24 * 60 * 60 * 1000);
  const sorguBitis = new Date(bitis.getTime());

  // Açık onay/itiraz, rezervasyon tarihinden bağımsız olarak bu ay gelmiş olabilir
  // (ör. misafir geç yanıt verdi); bunları ayrıca teyit zamanına göre de çekiyoruz.
  const [{ data: tarihAraligindakiler, error: hata1 }, { data: gecYanitlar, error: hata2 }] =
    await Promise.all([
      supabase
        .from("rezervasyonlar")
        .select("id, restoran_id, tarih_saat, misafir_teyit, misafir_teyit_zamani")
        .eq("kaynak", "online")
        .eq("geldi_mi", true)
        .gte("tarih_saat", sorguBaslangic.toISOString())
        .lt("tarih_saat", sorguBitis.toISOString()),
      supabase
        .from("rezervasyonlar")
        .select("id, restoran_id, tarih_saat, misafir_teyit, misafir_teyit_zamani")
        .eq("kaynak", "online")
        .eq("geldi_mi", true)
        .not("misafir_teyit", "is", null)
        .gte("misafir_teyit_zamani", baslangic.toISOString())
        .lt("misafir_teyit_zamani", bitis.toISOString()),
    ]);

  if (hata1 || hata2) {
    return NextResponse.json({ hata: "Rezervasyonlar okunamadı." }, { status: 500 });
  }

  const hepsi = new Map<string, Rezervasyon>();
  for (const r of [...(tarihAraligindakiler ?? []), ...(gecYanitlar ?? [])]) hepsi.set(r.id, r);

  // Restoran başına ücretsiz dönem bitiş tarihi — rezervasyonun ücrete tabi olup
  // olmadığı, rezervasyonun KENDİ tarihine göre belirlenir (Madde 4.1).
  const donemBitisleri = new Map<string, number>();
  for (const r of restoranlar ?? []) {
    const bitisTarihi = new Date(r.olusturulma);
    bitisTarihi.setUTCMonth(bitisTarihi.getUTCMonth() + UCRETSIZ_DONEM_AY);
    donemBitisleri.set(r.id, bitisTarihi.getTime());
  }

  const simdi = Date.now();
  let bekleyenToplam = 0;

  type Kesinlesme = { restoran_id: string; kesinlesmeSekli: "onay" | "sessizlik" | "itiraz" };
  const buAyKesinlesenler: Kesinlesme[] = [];

  for (const r of hepsi.values()) {
    const donemBitis = donemBitisleri.get(r.restoran_id);
    if (donemBitis === undefined || new Date(r.tarih_saat).getTime() < donemBitis) continue; // hâlâ ücretsiz dönemde

    const durum = tahakkukDurumu(r, simdi);
    if (!durum) {
      bekleyenToplam++;
      continue;
    }
    if (durum.zaman >= baslangic.getTime() && durum.zaman < bitis.getTime()) {
      buAyKesinlesenler.push({ restoran_id: r.restoran_id, kesinlesmeSekli: durum.kesinlesmeSekli });
    }
  }

  const satirlar: RestoranSatir[] = (restoranlar ?? []).map((r) => {
    const onaylananVeSessiz = buAyKesinlesenler.filter(
      (k) => k.restoran_id === r.id && k.kesinlesmeSekli !== "itiraz"
    ).length;
    const itirazli = buAyKesinlesenler.filter(
      (k) => k.restoran_id === r.id && k.kesinlesmeSekli === "itiraz"
    ).length;

    const seviye = fiyatSeviyesi(r.ortalama_fiyat, r.fiyat_seviyesi) ?? 1;
    const tutar = onaylananVeSessiz * KADEME_TUTARLARI[seviye];

    return {
      restoranId: r.id,
      restoranAd: r.ad,
      restoranEposta: r.eposta,
      ucretsizDonemBitisi: new Date(donemBitisleri.get(r.id)!).toISOString(),
      kesinlesmisMisafirSayisi: onaylananVeSessiz,
      itirazliSayisi: itirazli,
      toplamTutar: tutar,
    };
  });

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ ay: etiket, restoranlar: satirlar, bekleyen: bekleyenToplam });
  }

  return new NextResponse(tabloHtml(satirlar, etiket, bekleyenToplam), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
