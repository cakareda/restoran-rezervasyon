"use client";

import { useEffect, useRef, useState } from "react";
import { AramaIkonu } from "@/components/icons";

export type GooglePlaceSonucu = {
  ad: string;
  adres: string;
  telefon: string;
  sehir: string;
  semt: string;
};

type GoogleAdresBileseni = { long_name: string; types: string[] };
type GooglePlace = {
  name?: string;
  formatted_address?: string;
  international_phone_number?: string;
  address_components?: GoogleAdresBileseni[];
};
type GoogleAutocomplete = {
  addListener: (olay: string, geriCagirma: () => void) => void;
  getPlace: () => GooglePlace;
};
type GoogleMapsNamespace = {
  maps: {
    places: { Autocomplete: new (el: HTMLInputElement, secenekler: object) => GoogleAutocomplete };
    event: { clearInstanceListeners: (nesne: unknown) => void };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __googleMapsYukleniyor?: Promise<void>;
  }
}

function googleMapsYukle(apiKey: string) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__googleMapsYukleniyor) return window.__googleMapsYukleniyor;

  window.__googleMapsYukleniyor = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr&region=TR`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps yüklenemedi"));
    document.head.appendChild(script);
  });

  return window.__googleMapsYukleniyor;
}

function bilesenBul(bilesenler: GoogleAdresBileseni[], tur: string) {
  return bilesenler.find((b) => b.types.includes(tur))?.long_name ?? "";
}

export default function GooglePlacesArama({
  onSecim,
}: {
  onSecim: (sonuc: GooglePlaceSonucu) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "hata">(
    apiKey ? "yukleniyor" : "hata"
  );

  useEffect(() => {
    if (!apiKey) return;

    let autocomplete: GoogleAutocomplete | undefined;

    googleMapsYukle(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["establishment"],
          componentRestrictions: { country: "tr" },
          fields: ["name", "formatted_address", "international_phone_number", "address_components"],
        });

        autocomplete.addListener("place_changed", () => {
          const yer = autocomplete!.getPlace();
          if (!yer || !yer.name) return;

          const bilesenler = yer.address_components ?? [];
          const sehir = bilesenBul(bilesenler, "administrative_area_level_1");
          const semt =
            bilesenBul(bilesenler, "administrative_area_level_2") ||
            bilesenBul(bilesenler, "sublocality_level_1") ||
            bilesenBul(bilesenler, "sublocality");

          onSecim({
            ad: yer.name ?? "",
            adres: yer.formatted_address ?? "",
            telefon: yer.international_phone_number ?? "",
            sehir,
            semt,
          });
        });

        setDurum("hazir");
      })
      .catch(() => setDurum("hata"));

    return () => {
      if (autocomplete) window.google?.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [apiKey, onSecim]);

  if (durum === "hata") return null;

  return (
    <div className="rounded-xl border border-dashed border-brand/40 bg-brand-light p-4">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <AramaIkonu className="h-4 w-4 text-brand" /> Restoranınızı Google&apos;da arayın
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder={durum === "yukleniyor" ? "Yükleniyor..." : "Restoran adını yazmaya başlayın"}
        disabled={durum === "yukleniyor"}
        className="mt-2 w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
      />
      <p className="mt-1.5 text-xs text-muted">
        Seçtiğinizde adres ve telefon otomatik doldurulur — fotoğraflarınızı aşağıdan kendiniz yükleyin.
      </p>
    </div>
  );
}
