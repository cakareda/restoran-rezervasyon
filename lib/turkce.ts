const UNLULER = "aeıioöuü";
const KALIN_DUZ = ["a", "ı"];
const KALIN_YUVARLAK = ["o", "u"];
const INCE_YUVARLAK = ["ö", "ü"];

export function sehirIyelikEki(sehir: string) {
  const kucuk = sehir.toLocaleLowerCase("tr-TR");
  const sonUnlu = [...kucuk].reverse().find((harf) => UNLULER.includes(harf));

  let ek = "in";
  if (sonUnlu && KALIN_DUZ.includes(sonUnlu)) ek = "ın";
  else if (sonUnlu && KALIN_YUVARLAK.includes(sonUnlu)) ek = "un";
  else if (sonUnlu && INCE_YUVARLAK.includes(sonUnlu)) ek = "ün";

  const sonHarf = kucuk.slice(-1);
  const tampon = UNLULER.includes(sonHarf) ? "n" : "";

  return `${sehir}'${tampon}${ek}`;
}
