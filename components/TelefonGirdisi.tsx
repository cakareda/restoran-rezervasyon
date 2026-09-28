"use client";

import { useState } from "react";

const ULKE_KODLARI = [
  { kod: "+90", ad: "Türkiye" },
  { kod: "+1", ad: "ABD/Kanada" },
  { kod: "+44", ad: "İngiltere" },
  { kod: "+49", ad: "Almanya" },
  { kod: "+33", ad: "Fransa" },
  { kod: "+39", ad: "İtalya" },
  { kod: "+34", ad: "İspanya" },
  { kod: "+31", ad: "Hollanda" },
  { kod: "+7", ad: "Rusya" },
  { kod: "+966", ad: "Suudi Arabistan" },
  { kod: "+971", ad: "BAE" },
  { kod: "+20", ad: "Mısır" },
  { kod: "+30", ad: "Yunanistan" },
  { kod: "+46", ad: "İsveç" },
  { kod: "+41", ad: "İsviçre" },
];

/** İki parçalı (ülke kodu + numara) telefon girişi; dışarıya tek bir E.164 benzeri
 *  değer (örn. "+905551234567") verir. `name` verilirse native form gönderimi için
 *  gizli bir input da render eder; `onChange` verilirse kontrollü bileşen gibi çalışır. */
export default function TelefonGirdisi({
  name,
  defaultValue,
  value,
  onChange,
  girdiSinifi,
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (deger: string) => void;
  girdiSinifi: string;
  placeholder?: string;
}) {
  const kaynakDeger = value ?? defaultValue ?? "";
  const baslangicKod = ULKE_KODLARI.find((u) => kaynakDeger.startsWith(u.kod))?.kod ?? "+90";
  const baslangicNumara = kaynakDeger.startsWith(baslangicKod)
    ? kaynakDeger.slice(baslangicKod.length).trim()
    : kaynakDeger;

  const [ulkeKoduIc, setUlkeKoduIc] = useState(baslangicKod);
  const [numaraIc, setNumaraIc] = useState(baslangicNumara);

  function guncelle(yeniKod: string, yeniNumara: string) {
    setUlkeKoduIc(yeniKod);
    setNumaraIc(yeniNumara);
    onChange?.(yeniNumara ? `${yeniKod}${yeniNumara.replace(/\s/g, "")}` : "");
  }

  return (
    <div className="flex gap-2">
      <select
        value={ulkeKoduIc}
        onChange={(e) => guncelle(e.target.value, numaraIc)}
        className={`${girdiSinifi} w-24 shrink-0`}
        aria-label="Ülke kodu"
      >
        {ULKE_KODLARI.map((u) => (
          <option key={u.kod} value={u.kod}>
            {u.kod}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={numaraIc}
        onChange={(e) => guncelle(ulkeKoduIc, e.target.value.replace(/[^\d\s]/g, ""))}
        placeholder={placeholder ?? "5xx xxx xx xx"}
        className={`${girdiSinifi} flex-1`}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={numaraIc ? `${ulkeKoduIc}${numaraIc.replace(/\s/g, "")}` : ""}
        />
      )}
    </div>
  );
}
