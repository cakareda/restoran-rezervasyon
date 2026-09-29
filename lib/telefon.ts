/** Telefon alanı opsiyonel olduğu için boş/null geçerli; doluysa anlamlı bir
 *  numara olmalı (yalnızca ülke kodu + birkaç rakam gibi eksik girişleri reddeder). */
export function telefonGecerliMi(telefon: string | null | undefined): boolean {
  if (!telefon) return true;
  const rakamlar = telefon.replace(/\D/g, "");
  return rakamlar.length >= 10;
}
