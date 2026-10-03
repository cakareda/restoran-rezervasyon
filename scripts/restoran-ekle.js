// kullanım: node scripts/restoran-ekle.js
const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");

for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com").replace(/\/$/, "");
const SIFRE_BELIRLEME_YOLU = "/restoran-girisi/sifre-sifirla";

// Şifreyi biz üretip WhatsApp/e-postayla düz metin iletmek yerine, Supabase'in
// tek kullanımlık, süreli (invite/recovery) linkini üretiyoruz. Restoran bu
// linke tıklayıp kendi şifresini kendisi belirliyor — biz şifreyi hiç görmüyoruz.
async function girisLinkiUret({ email, yeniHesap }) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: yeniHesap ? "invite" : "recovery",
    email,
    options: { redirectTo: `${SITE_URL}${SIFRE_BELIRLEME_YOLU}` },
  });
  if (error) throw error;
  return { link: data.properties.action_link, userId: data.user.id };
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const { data: bekleyenler } = await supabase
    .from("basvurular")
    .select("*")
    .eq("durum", "bekliyor")
    .order("olusturulma", { ascending: true });

  if (!bekleyenler || bekleyenler.length === 0) {
    console.log("Bekleyen başvuru yok.");
    rl.close();
    return;
  }

  console.log("\nBekleyen başvurular:\n");
  bekleyenler.forEach((b, i) => {
    console.log(`${i + 1}) ${b.restoran_adi} — ${b.eposta} — ${b.telefon ?? "telefon yok"}`);
  });

  const secimHam = await rl.question("\nHangisini ekliyorsun? (numara): ");
  const secilen = bekleyenler[Number(secimHam) - 1];
  if (!secilen) {
    console.log("Geçersiz seçim.");
    rl.close();
    return;
  }

  console.log(`\n${secilen.restoran_adi} seçildi.`);
  if (secilen.masa_duzeni) console.log(`Masa düzeni (bildirdiği): ${secilen.masa_duzeni}`);
  if (secilen.menu) console.log(`Menü (bildirdiği): ${secilen.menu}`);

  const sehir = await rl.question("Şehir: ");
  const semt = await rl.question("Semt: ");
  const mutfakTuru = await rl.question("Mutfak türü (örn. Türk, Kebap, İtalyan...): ");

  // Fiyat seviyesi (ve dolayısıyla komisyon kademesi) kasıtlı olarak yalnızca
  // burada belirleniyor — restoran panelden kendi fiyat seviyesini seçip en
  // düşük komisyon kademesine kaçamasın diye. Menü/ortalama fiyat bilgisine
  // (başvuruda bildirdiyse yukarıda göründü) bakarak sen karar ver.
  let fiyatSeviyesi = null;
  while (!fiyatSeviyesi) {
    const ham = await rl.question(
      "Fiyat seviyesi (1=S1 0-500TL/15, 2=S2 501-1000TL/30, 3=S3 1001-2000TL/60, 4=S4 2001TL+/120): "
    );
    if (["1", "2", "3", "4"].includes(ham.trim())) fiyatSeviyesi = Number(ham.trim());
    else console.log("Lütfen 1-4 arası bir sayı gir.");
  }

  const { data: varOlanKullanici } = await supabase.auth.admin.listUsers();
  const mevcut = varOlanKullanici?.users?.find((u) => u.email === secilen.eposta);

  let userId;
  let girisLinki = null;

  try {
    const sonuc = await girisLinkiUret({ email: secilen.eposta, yeniHesap: !mevcut });
    userId = sonuc.userId;
    girisLinki = sonuc.link;
    if (mevcut) console.log("\nBu e-postayla zaten bir hesap var, mevcut hesap kullanılacak.");
  } catch (e) {
    console.error("Hesap/giriş linki oluşturulamadı:", e.message);
    rl.close();
    return;
  }

  const { data: restoran, error: restoranErr } = await supabase
    .from("restoranlar")
    .upsert(
      {
        auth_user_id: userId,
        ad: secilen.restoran_adi,
        sehir,
        semt,
        mutfak_turu: mutfakTuru,
        eposta: secilen.eposta,
        telefon: secilen.telefon,
        fiyat_seviyesi: fiyatSeviyesi,
        kurucu_restoran: new Date() <= new Date("2026-12-31T23:59:59+03:00"),
        aktivasyon_tarihi: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" }
    )
    .select("id")
    .single();

  if (restoranErr) {
    console.error("Restoran kaydedilemedi:", restoranErr.message);
    rl.close();
    return;
  }

  await supabase.from("basvurular").update({ durum: "tamamlandi" }).eq("id", secilen.id);

  console.log("\n✅ Restoran eklendi.");
  console.log(`Restoran ID: ${restoran.id}`);
  console.log(`E-posta: ${secilen.eposta}`);
  console.log(`\nŞifre belirleme linki (restorana WhatsApp/e-posta ile ilet, biz şifreyi hiç görmüyoruz):`);
  console.log(girisLinki);
  console.log(
    "\nNot: Bu link Supabase ayarlarındaki süre sonunda (varsayılan 24 saat/1 saat) geçersiz olur. " +
      "Süresi dolarsa restoran panelden 'Şifremi unuttum' akışını kullanabilir."
  );
  console.log(
    `\nMasa düzenini ve menüyü panelden (Restoranım > Masa envanteri / Menü linki) birlikte ya da restoran kendi başına tamamlayabilir.`
  );

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
