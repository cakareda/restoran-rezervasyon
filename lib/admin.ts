// Admin paneli ayrı bir rol/yetki tablosu gerektirmiyor — tek kurucu (sen)
// olduğun için ADMIN_EPOSTALAR ortam değişkenindeki (virgülle ayrılmış)
// e-posta adreslerinden biriyle giriş yapmış olmak yeterli. İleride birden
// fazla admin/personel olursa burası gerçek bir roller tablosuna taşınabilir.
//
// Değer Vercel'de yanlış girilmiş olabilir diye toleranslı okunuyor: tırnaklar
// ve baştaki "ADMIN_EPOSTALAR=" öneki (tüm satırın değere yapıştırılması) yok sayılır.
export function adminEpostalari(): string[] {
  return (process.env.ADMIN_EPOSTALAR ?? "")
    .split(/[,;\s]+/)
    .map((e) =>
      e
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/^.*=/, "")
        .replace(/^["']|["']$/g, "")
        .toLowerCase()
    )
    .filter(Boolean);
}

export function adminMi(eposta: string | null | undefined): boolean {
  if (!eposta) return false;
  return adminEpostalari().includes(eposta.trim().toLowerCase());
}
