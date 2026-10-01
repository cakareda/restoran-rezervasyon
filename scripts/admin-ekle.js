// kullanım: node scripts/admin-ekle.js info@masadaki.com
// Admin paneline (/admin) girecek hesabı oluşturur (yoksa) ve şifre belirleme
// linki üretir — şifreyi biz üretmiyoruz/görmüyoruz, aynı restoran-ekle.js
// mantığı. Linki aldıktan sonra .env'deki ADMIN_EPOSTALAR'a bu e-postayı
// eklemeyi unutma.
const fs = require("fs");
const path = require("path");

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
const SIFRE_BELIRLEME_YOLU = "/hesap/sifre-sifirla";

async function main() {
  const eposta = process.argv[2];
  if (!eposta) {
    console.error("Kullanım: node scripts/admin-ekle.js eposta@adres.com");
    process.exit(1);
  }

  const { data: varOlanlar } = await supabase.auth.admin.listUsers();
  const mevcut = varOlanlar?.users?.find((u) => u.email === eposta);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: mevcut ? "recovery" : "invite",
    email: eposta,
    options: { redirectTo: `${SITE_URL}${SIFRE_BELIRLEME_YOLU}` },
  });

  if (error) {
    console.error("Link oluşturulamadı:", error.message);
    process.exit(1);
  }

  console.log(mevcut ? "\nBu e-postayla zaten bir hesap var." : "\n✅ Yeni hesap oluşturuldu.");
  console.log(`\nŞifre belirleme linki (kendine gönder, tarayıcıda aç, şifreni belirle):`);
  console.log(data.properties.action_link);
  console.log(
    `\nŞifreni belirledikten sonra .env.local ve Vercel'deki ADMIN_EPOSTALAR değişkenine "${eposta}" ekle, sonra /admin/giris'ten giriş yapabilirsin.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
