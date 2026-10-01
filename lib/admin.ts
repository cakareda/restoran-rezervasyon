// Admin paneli ayrı bir rol/yetki tablosu gerektirmiyor — tek kurucu (sen)
// olduğun için ADMIN_EPOSTALAR ortam değişkenindeki (virgülle ayrılmış)
// e-posta adreslerinden biriyle giriş yapmış olmak yeterli. İleride birden
// fazla admin/personel olursa burası gerçek bir roller tablosuna taşınabilir.
export function adminEpostalari(): string[] {
  return (process.env.ADMIN_EPOSTALAR ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function adminMi(eposta: string | null | undefined): boolean {
  if (!eposta) return false;
  return adminEpostalari().includes(eposta.toLowerCase());
}
