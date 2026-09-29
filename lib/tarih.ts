// İstanbul UTC+3 sabit; sunucunun (genelde UTC) kendi saat dilimini kullanırsak
// akşam saatlerinde sunucu ile tarayıcı "bugün"ü farklı hesaplar ve bu da
// hydration uyuşmazlığına yol açar — bu yüzden runtime'ın local saatine değil
// her zaman İstanbul saatine göre hesaplıyoruz.
export function yerelTarih(tarih: Date) {
  const istanbul = new Date(tarih.getTime() + 3 * 60 * 60 * 1000);
  const yil = istanbul.getUTCFullYear();
  const ay = String(istanbul.getUTCMonth() + 1).padStart(2, "0");
  const gun = String(istanbul.getUTCDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

export function bugununTarihi() {
  return yerelTarih(new Date());
}

// Türkiye DST uygulamadığı için sabit UTC+3 — tarayıcının/sunucunun kendi saat
// dilimi ne olursa olsun "19:30" her zaman İstanbul saatiyle 19:30 olarak
// yorumlanır (tarayıcı başka bir ülkede olan turistler için de doğru çalışır).
export function istanbulTarihSaat(tarih: string, saat: string): Date {
  return new Date(`${tarih}T${saat}:00+03:00`);
}
