export function yerelTarih(tarih: Date) {
  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, "0");
  const gun = String(tarih.getDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

export function bugununTarihi() {
  return yerelTarih(new Date());
}
