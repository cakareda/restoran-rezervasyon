// kullanım: node scripts/fiyat-seviyesi-guncelle.js
// Zaten kayıtlı bir restoranın fiyat seviyesini (komisyon kademesini) sonradan
// değiştirmek için — restoran-ekle.js sadece ilk kayıtta soruyor, bu script
// var olan restoranlar için.
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

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const { data: restoranlar } = await supabase
    .from("restoranlar")
    .select("id, ad, semt, fiyat_seviyesi")
    .order("ad", { ascending: true });

  if (!restoranlar || restoranlar.length === 0) {
    console.log("Hiç restoran yok.");
    rl.close();
    return;
  }

  const seviyeEtiketi = { 1: "₺", 2: "₺₺", 3: "₺₺₺", 4: "₺₺₺₺", null: "belirlenmedi" };

  console.log("\nRestoranlar:\n");
  restoranlar.forEach((r, i) => {
    console.log(`${i + 1}) ${r.ad}${r.semt ? ` (${r.semt})` : ""} — şu an: ${seviyeEtiketi[r.fiyat_seviyesi]}`);
  });

  const secimHam = await rl.question("\nHangisini güncelliyorsun? (numara): ");
  const secilen = restoranlar[Number(secimHam) - 1];
  if (!secilen) {
    console.log("Geçersiz seçim.");
    rl.close();
    return;
  }

  let yeniSeviye = null;
  while (!yeniSeviye) {
    const ham = await rl.question(
      "Yeni fiyat seviyesi (1=₺, 2=₺₺, 3=₺₺₺, 4=₺₺₺₺): "
    );
    if (["1", "2", "3", "4"].includes(ham.trim())) yeniSeviye = Number(ham.trim());
    else console.log("Lütfen 1-4 arası bir sayı gir.");
  }

  const { error } = await supabase
    .from("restoranlar")
    .update({ fiyat_seviyesi: yeniSeviye })
    .eq("id", secilen.id);

  if (error) {
    console.error("Güncellenemedi:", error.message);
  } else {
    console.log(`\n✅ ${secilen.ad} → ${seviyeEtiketi[yeniSeviye]} olarak güncellendi.`);
  }

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
