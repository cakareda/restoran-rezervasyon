"use client";

import { useCallback, useState } from "react";
import { OLANAK_ETIKETLERI, type Restoran } from "@/lib/types";
import OlanakIkonu from "@/components/OlanakIkonu";
import GooglePlacesArama, { type GooglePlaceSonucu } from "@/components/GooglePlacesArama";

const girdiStil =
  "w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";
const etiketStil = "block text-sm font-medium text-foreground mb-1";

export default function RestoranimForm({
  restoran,
  kaydet,
}: {
  restoran: Restoran | null;
  kaydet: (formData: FormData) => void;
}) {
  const [ad, setAd] = useState(restoran?.ad ?? "");
  const [sehir, setSehir] = useState(restoran?.sehir ?? "");
  const [semt, setSemt] = useState(restoran?.semt ?? "");
  const [telefon, setTelefon] = useState(restoran?.telefon ?? "");
  const [adres, setAdres] = useState(restoran?.adres ?? "");
  const [fotograflar, setFotograflar] = useState(restoran?.fotograflar?.join("\n") ?? "");

  const googleSecimUygula = useCallback((sonuc: GooglePlaceSonucu) => {
    setAd(sonuc.ad);
    setAdres(sonuc.adres);
    if (sonuc.telefon) setTelefon(sonuc.telefon);
    if (sonuc.sehir) setSehir(sonuc.sehir);
    if (sonuc.semt) setSemt(sonuc.semt);
    if (sonuc.fotograflar.length > 0) setFotograflar(sonuc.fotograflar.join("\n"));
  }, []);

  return (
    <form
      action={kaydet}
      className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <GooglePlacesArama onSecim={googleSecimUygula} />

      <div>
        <label className={etiketStil}>Restoran adı</label>
        <input
          name="ad"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          required
          className={girdiStil}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiketStil}>Şehir</label>
          <input
            name="sehir"
            value={sehir}
            onChange={(e) => setSehir(e.target.value)}
            required
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Semt</label>
          <input
            name="semt"
            value={semt}
            onChange={(e) => setSemt(e.target.value)}
            required
            className={girdiStil}
          />
        </div>
      </div>
      <div>
        <label className={etiketStil}>Mutfak türü</label>
        <input
          name="mutfakTuru"
          defaultValue={restoran?.mutfak_turu}
          required
          placeholder="örn. İtalyan"
          className={girdiStil}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiketStil}>Bildirim e-postası</label>
          <input
            name="eposta"
            type="email"
            defaultValue={restoran?.eposta}
            required
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Telefon</label>
          <input
            name="telefon"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className={girdiStil}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiketStil}>Kapasite</label>
          <input
            name="kapasite"
            type="number"
            defaultValue={restoran?.kapasite ?? ""}
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Ortalama fiyat</label>
          <input
            name="ortalamaFiyat"
            defaultValue={restoran?.ortalama_fiyat ?? ""}
            placeholder="örn. 500-800 TL"
            className={girdiStil}
          />
        </div>
      </div>
      <div>
        <label className={etiketStil}>Açıklama</label>
        <textarea
          name="aciklama"
          defaultValue={restoran?.aciklama ?? ""}
          placeholder="Restoranınız hakkında kısa açıklama"
          rows={4}
          className={girdiStil}
        />
      </div>

      <div>
        <label className={etiketStil}>Adres</label>
        <input
          name="adres"
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          placeholder="Tam adres (haritada ve detay sayfasında gösterilir)"
          className={girdiStil}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiketStil}>Açılış saati</label>
          <input
            name="acilisSaati"
            type="time"
            defaultValue={restoran?.acilis_saati?.slice(0, 5) ?? "12:00"}
            required
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Kapanış saati</label>
          <input
            name="kapanisSaati"
            type="time"
            defaultValue={restoran?.kapanis_saati?.slice(0, 5) ?? "23:00"}
            required
            className={girdiStil}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Rezervasyon saat seçenekleri bu aralığa göre gösterilir.
      </p>

      <div>
        <label className={etiketStil}>Olanaklar</label>
        <div className="grid grid-cols-2 gap-2">
          {OLANAK_ETIKETLERI.map((olanak) => (
            <label
              key={olanak.deger}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground has-[:checked]:border-brand has-[:checked]:bg-brand-light"
            >
              <input
                type="checkbox"
                name="olanaklar"
                value={olanak.deger}
                defaultChecked={restoran?.olanaklar?.includes(olanak.deger)}
                className="accent-brand"
              />
              <OlanakIkonu deger={olanak.deger} className="h-4 w-4 text-muted" />
              {olanak.etiket}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={etiketStil}>Fotoğraflar</label>
        <textarea
          name="fotograflar"
          value={fotograflar}
          onChange={(e) => setFotograflar(e.target.value)}
          placeholder="Her satıra bir fotoğraf linki (URL) yapıştırın"
          rows={3}
          className={girdiStil}
        />
        {fotograflar && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {fotograflar
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((url) => (
                <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Kaydet
      </button>
    </form>
  );
}
