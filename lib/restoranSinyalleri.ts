import { createServiceRoleClient } from "@/lib/supabase/server";

// Restoran davranış sinyalleri (admin paneli): sahte No-Show, aşırı restoran iptali,
// yanıtsız talepler ve misafir uyuşmazlıkları gibi komisyondan kaçınma/kötüye kullanım
// işaretlerini restoran bazında ve platform ortalamasıyla kıyaslayarak gösterir.
// Yalnızca Masadaki kaynaklı (kaynak=online), saati geçmiş rezervasyonlar değerlendirilir.

const MIN_ORNEK = 5;

type Satir = {
  restoran_id: string;
  durum: string;
  iptal_eden: string | null;
  geldi_mi: boolean | null;
  misafir_teyit: boolean | null;
  tarih_saat: string;
};

export type Sinyal = { kod: string; etiket: string; agirlik: number };

export type RestoranSinyali = {
  restoranId: string;
  restoranAd: string;
  toplam: number;
  onaylanan: number;
  geldi: number;
  noShow: number;
  isaretsiz: number;
  restoranIptal: number;
  misafirIptal: number;
  reddedilen: number;
  yanitsiz: number;
  uyusmazlik: number;
  misafirUyarisi: number;
  noShowOrani: number | null;
  restoranIptalOrani: number | null;
  yanitsizOrani: number | null;
  sinyaller: Sinyal[];
  risk: number;
};

async function tumSatirlariGetir(baslangic: Date, bitis: Date): Promise<Satir[]> {
  const supabase = createServiceRoleClient();
  const sonuc: Satir[] = [];
  const sayfa = 1000;
  for (let ofset = 0; ofset < 50000; ofset += sayfa) {
    const { data, error } = await supabase
      .from("rezervasyonlar")
      .select("restoran_id, durum, iptal_eden, geldi_mi, misafir_teyit, tarih_saat")
      .eq("kaynak", "online")
      .gte("tarih_saat", baslangic.toISOString())
      .lt("tarih_saat", bitis.toISOString())
      .order("tarih_saat", { ascending: true })
      .range(ofset, ofset + sayfa - 1);
    if (error) throw new Error("Rezervasyonlar okunamadı.");
    sonuc.push(...((data ?? []) as Satir[]));
    if (!data || data.length < sayfa) break;
  }
  return sonuc;
}

const oran = (pay: number, payda: number) => (payda > 0 ? pay / payda : null);

export async function restoranSinyalleriHesapla(gun: number) {
  const simdi = Date.now();
  const bitis = new Date(simdi);
  const baslangic = new Date(simdi - gun * 24 * 60 * 60 * 1000);

  const supabase = createServiceRoleClient();
  const { data: restoranlar, error } = await supabase.from("restoranlar").select("id, ad");
  if (error) throw new Error("Restoranlar okunamadı.");

  const satirlar = await tumSatirlariGetir(baslangic, bitis);

  const gruplar = new Map<string, Satir[]>();
  for (const s of satirlar) {
    const liste = gruplar.get(s.restoran_id) ?? [];
    liste.push(s);
    gruplar.set(s.restoran_id, liste);
  }

  function say(liste: Satir[]) {
    const gecmisSaat = (s: Satir) => new Date(s.tarih_saat).getTime() < simdi - 12 * 3600000;
    const onayli = liste.filter((s) => s.durum === "onaylandi");
    const geldi = onayli.filter((s) => s.geldi_mi === true).length;
    const noShow = onayli.filter((s) => s.geldi_mi === false).length;
    const isaretsiz = onayli.filter((s) => s.geldi_mi === null && gecmisSaat(s)).length;
    const restoranIptal = liste.filter((s) => s.durum === "iptal_edildi" && s.iptal_eden === "restoran").length;
    const misafirIptal = liste.filter((s) => s.durum === "iptal_edildi" && s.iptal_eden === "misafir").length;
    const reddedilen = liste.filter((s) => s.durum === "reddedildi").length;
    const yanitsiz = liste.filter((s) => s.durum === "beklemede" && gecmisSaat(s)).length;
    // Restoran "gelmedi/iptal" dedi ama misafir "gittim" dedi.
    const uyusmazlik =
      onayli.filter((s) => s.geldi_mi === false && s.misafir_teyit === true).length +
      liste.filter((s) => s.durum === "iptal_edildi" && s.iptal_eden === "restoran" && s.misafir_teyit === true).length;
    // Restoran "geldi" dedi ama misafir "gitmedim" dedi.
    const misafirUyarisi = onayli.filter((s) => s.geldi_mi === true && s.misafir_teyit === false).length;
    return {
      toplam: liste.length,
      onaylanan: onayli.length,
      geldi,
      noShow,
      isaretsiz,
      restoranIptal,
      misafirIptal,
      reddedilen,
      yanitsiz,
      uyusmazlik,
      misafirUyarisi,
    };
  }

  const platform = say(satirlar);
  const platformNoShowOrani = oran(platform.noShow, platform.geldi + platform.noShow);

  const sonuc: RestoranSinyali[] = (restoranlar ?? []).map((r) => {
    const s = say(gruplar.get(r.id) ?? []);
    const noShowOrani = oran(s.noShow, s.geldi + s.noShow);
    const restoranIptalOrani = oran(s.restoranIptal, s.toplam);
    const yanitsizOrani = oran(s.yanitsiz, s.toplam);
    const sinyaller: Sinyal[] = [];

    if (
      noShowOrani !== null &&
      s.geldi + s.noShow >= MIN_ORNEK &&
      noShowOrani >= Math.max(0.25, (platformNoShowOrani ?? 0) * 2)
    ) {
      sinyaller.push({ kod: "noshow", etiket: "Yüksek No-Show oranı", agirlik: 3 });
    }
    if (restoranIptalOrani !== null && s.toplam >= MIN_ORNEK && s.restoranIptal >= 3 && restoranIptalOrani >= 0.2) {
      sinyaller.push({ kod: "iptal", etiket: "Yüksek restoran iptali", agirlik: 3 });
    }
    if (s.uyusmazlik >= 2) {
      sinyaller.push({ kod: "uyusmazlik", etiket: "Misafir uyuşmazlığı", agirlik: 4 });
    }
    if (yanitsizOrani !== null && s.toplam >= MIN_ORNEK && yanitsizOrani >= 0.3) {
      sinyaller.push({ kod: "yanitsiz", etiket: "Yanıtsız talepler", agirlik: 2 });
    }
    if (s.onaylanan >= MIN_ORNEK && s.isaretsiz / s.onaylanan >= 0.5) {
      sinyaller.push({ kod: "isaretsiz", etiket: "Geldi/Gelmedi işaretlemiyor", agirlik: 1 });
    }

    return {
      restoranId: r.id,
      restoranAd: r.ad,
      ...s,
      noShowOrani,
      restoranIptalOrani,
      yanitsizOrani,
      sinyaller,
      risk: sinyaller.reduce((t, x) => t + x.agirlik, 0),
    };
  });

  sonuc.sort((a, b) => b.risk - a.risk || b.toplam - a.toplam);

  return { gun, platform: { ...platform, noShowOrani: platformNoShowOrani }, restoranlar: sonuc };
}
