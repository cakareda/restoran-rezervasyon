const fs = require("fs");
const path = require("path");
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const email = "panel-test-" + Date.now() + "@example.internal";
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password: "test1234",
    email_confirm: true,
  });
  if (userErr) throw userErr;

  const { data: restoran, error: restoranErr } = await supabase
    .from("restoranlar")
    .insert({
      auth_user_id: userData.user.id,
      ad: "PANEL TEST Restoranı",
      sehir: "İzmir",
      semt: "Alsancak",
      mutfak_turu: "Türk",
      eposta: email,
      acilis_saati: "12:00",
      kapanis_saati: "23:00",
    })
    .select("id")
    .single();
  if (restoranErr) throw restoranErr;

  const { data: musteri, error: musteriErr } = await supabase
    .from("kullanicilar")
    .insert({ ad_soyad: "Panel Test Müşteri", eposta: "panel-test-musteri@example.internal" })
    .select("id")
    .single();
  if (musteriErr) throw musteriErr;

  const bugun = new Date();
  const bugunSaat19 = new Date(bugun);
  bugunSaat19.setHours(19, 0, 0, 0);
  const yarinSaat20 = new Date(bugun);
  yarinSaat20.setDate(yarinSaat20.getDate() + 1);
  yarinSaat20.setHours(20, 0, 0, 0);

  const { error: rezErr } = await supabase.from("rezervasyonlar").insert([
    {
      restoran_id: restoran.id,
      kullanici_id: musteri.id,
      tarih_saat: bugunSaat19.toISOString(),
      kisi_sayisi: 4,
      durum: "beklemede",
      notlar: "Fıstık alerjisi var, VIP misafir",
    },
    {
      restoran_id: restoran.id,
      kullanici_id: musteri.id,
      tarih_saat: yarinSaat20.toISOString(),
      kisi_sayisi: 2,
      durum: "onaylandi",
    },
  ]);
  if (rezErr) throw rezErr;

  console.log(JSON.stringify({ email, password: "test1234", restoranId: restoran.id, userId: userData.user.id }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
