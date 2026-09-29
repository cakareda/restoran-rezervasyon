import { createClient } from "@/lib/supabase/server";

export default async function Raporlar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  if (!restoran) {
    return <p className="text-muted">Önce restoran profilinizi tamamlayın.</p>;
  }

  const ayBaslangic = new Date();
  ayBaslangic.setDate(1);
  ayBaslangic.setHours(0, 0, 0, 0);

  const { data: rezervasyonlar } = await supabase
    .from("rezervasyonlar")
    .select("durum, geldi_mi, kisi_sayisi, kaynak, tarih_saat")
    .eq("restoran_id", restoran.id)
    .gte("tarih_saat", ayBaslangic.toISOString());

  const liste = rezervasyonlar ?? [];
  const toplam = liste.length;
  const onaylanan = liste.filter((r) => r.durum === "onaylandi" || r.geldi_mi !== null).length;
  const reddedilen = liste.filter((r) => r.durum === "reddedildi").length;
  const misafirIptali = liste.filter((r) => r.durum === "iptal_edildi").length;
  const geldi = liste.filter((r) => r.geldi_mi === true).length;
  const gelmedi = liste.filter((r) => r.geldi_mi === false).length;
  const gelmemeOrani =
    geldi + gelmedi > 0 ? Math.round((gelmedi / (geldi + gelmedi)) * 100) : 0;
  const toplamKisi = liste.reduce((n, r) => n + r.kisi_sayisi, 0);
  const ortalamaKisi = toplam > 0 ? (toplamKisi / toplam).toFixed(1) : "0";
  const onlineOran = toplam > 0 ? Math.round((liste.filter((r) => r.kaynak === "online").length / toplam) * 100) : 0;

  const kartlar = [
    { baslik: "Bu ay toplam talep", deger: toplam },
    { baslik: "Onaylanan", deger: onaylanan },
    { baslik: "Reddedilen", deger: reddedilen },
    { baslik: "Misafir iptali", deger: misafirIptali },
    { baslik: "Gelmeme oranı", deger: `%${gelmemeOrani}` },
    { baslik: "Ortalama kişi sayısı", deger: ortalamaKisi },
    { baslik: "Toplam misafir", deger: toplamKisi },
    { baslik: "Online rezervasyon oranı", deger: `%${onlineOran}` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Raporlar</h1>
      <p className="mt-1 text-sm text-muted">Bu ayın özeti (ayın 1&apos;inden bugüne).</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartlar.map((k) => (
          <div key={k.baslik} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-2xl font-extrabold text-brand-dark">{k.deger}</p>
            <p className="mt-1 text-xs text-muted">{k.baslik}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
