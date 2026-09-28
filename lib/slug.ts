const TR_HARF_ESLEME: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugYap(metin: string) {
  return metin
    .split("")
    .map((harf) => TR_HARF_ESLEME[harf] ?? harf)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function restoranYolu(restoran: { id: string; ad: string; sehir: string; semt: string }) {
  return `/${slugYap(restoran.sehir)}/${slugYap(restoran.semt)}/${slugYap(restoran.ad)}`;
}
