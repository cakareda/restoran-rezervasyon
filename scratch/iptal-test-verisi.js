const fs = require("fs");
const path = require("path");
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email: "iptal-test-" + Date.now() + "@example.internal",
    password: "test1234",
    email_confirm: true,
  });
  if (userErr) throw userErr;

  const { data: restoran, error: restoranErr } = await supabase
    .from("restoranlar")
    .insert({
      auth_user_id: userData.user.id,
      ad: "IPTAL TEST Restoranı",
      sehir: "İzmir",
      semt: "Alsancak",
      mutfak_turu: "Türk",
      eposta: userData.user.email,
      acilis_saati: "12:00",
      kapanis_saati: "23:00",
    })
    .select("id")
    .single();
  if (restoranErr) throw restoranErr;

  const { data: musteri, error: musteriErr } = await supabase
    .from("kullanicilar")
    .insert({ ad_soyad: "Iptal Test Müşteri", eposta: "iptal-test-musteri@example.internal" })
    .select("id")
    .single();
  if (musteriErr) throw musteriErr;

  const yarin = new Date();
  yarin.setDate(yarin.getDate() + 1);
  yarin.setHours(20, 0, 0, 0);

  const { data: rezervasyon, error: rezErr } = await supabase
    .from("rezervasyonlar")
    .insert({
      restoran_id: restoran.id,
      kullanici_id: musteri.id,
      tarih_saat: yarin.toISOString(),
      kisi_sayisi: 3,
      durum: "onaylandi",
    })
    .select("id")
    .single();
  if (rezErr) throw rezErr;

  console.log(JSON.stringify({ rezervasyonId: rezervasyon.id, restoranId: restoran.id, userId: userData.user.id, musteriId: musteri.id }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
