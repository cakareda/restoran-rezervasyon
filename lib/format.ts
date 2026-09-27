export function fiyatTemizle(deger: string) {
  return deger.replace(/^\s*(₺|TL)\s*/i, "").replace(/\s*TL\s*$/i, "");
}

export function fiyatGoster(deger: string | null | undefined) {
  if (!deger) return null;
  const temiz = fiyatTemizle(deger);
  return temiz ? `₺${temiz}` : null;
}
