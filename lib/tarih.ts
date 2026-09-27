export function yerelTarih(tarih: Date) {
  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, "0");
  const gun = String(tarih.getDate()).padStart(2, "0");
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
