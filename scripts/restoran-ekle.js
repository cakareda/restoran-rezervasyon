// kullanım: node scripts/restoran-ekle.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

function guvenliSifreUret() {
  const grup = () => crypto.randomBytes(3).toString("hex");
  return `${grup()}-${grup()}-${grup()}`;
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

  const { data: varOlanKullanici } = await supabase.auth.admin.listUsers();
  const mevcut = varOlanKullanici?.users?.find((u) => u.email === secilen.eposta);

  let userId;
  let sifre = null;

  if (mevcut) {
    console.log("\nBu e-postayla zaten bir hesap var, mevcut hesap kullanılacak.");
    userId = mevcut.id;
  } else {
    sifre = guvenliSifreUret();
    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email: secilen.eposta,
      password: sifre,
      email_confirm: true,
    });
    if (userErr) {
      console.error("Hesap oluşturulamadı:", userErr.message);
      rl.close();
      return;
    }
    userId = userData.user.id;
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
  console.log(`Giriş: masadaki.com/restoran-girisi`);
  console.log(`E-posta: ${secilen.eposta}`);
  if (sifre) {
    console.log(`Geçici şifre: ${sifre}`);
    console.log(
      "\nBu şifreyi restorana WhatsApp/e-posta ile kendin ilet. İstersen panelden 'Şifremi unuttum' ile kendi şifresini de belirleyebilir."
    );
  } else {
    console.log("(Hesap zaten vardı, şifre değiştirilmedi — mevcut şifresiyle giriş yapabilir.)");
  }
  console.log(
    `\nMasa düzenini ve menüyü panelden (Restoranım > Masa envanteri / Menü linki) birlikte ya da restoran kendi başına tamamlayabilir.`
  );

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
