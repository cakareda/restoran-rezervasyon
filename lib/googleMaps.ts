export type GoogleAdresBileseni = { long_name: string; types: string[] };
export type GooglePlace = {
  name?: string;
  formatted_address?: string;
  international_phone_number?: string;
  address_components?: GoogleAdresBileseni[];
  geometry?: { location?: { lat: () => number; lng: () => number } };
};
export type GoogleAutocomplete = {
  addListener: (olay: string, geriCagirma: () => void) => void;
  getPlace: () => GooglePlace;
};
export type GoogleMapInstance = { setCenter: (konum: { lat: number; lng: number }) => void };
export type GoogleMarker = object;
export type GoogleMapsNamespace = {
  maps: {
    places: { Autocomplete: new (el: HTMLInputElement, secenekler: object) => GoogleAutocomplete };
    Map: new (el: HTMLElement, secenekler: object) => GoogleMapInstance;
    Marker: new (secenekler: object) => GoogleMarker;
    InfoWindow: new (secenekler: object) => {
      open: (map: GoogleMapInstance, marker: GoogleMarker) => void;
    };
    LatLngBounds: new () => { extend: (konum: { lat: number; lng: number }) => void };
    event: {
      addListener: (nesne: unknown, olay: string, geriCagirma: () => void) => void;
      clearInstanceListeners: (nesne: unknown) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __googleMapsYukleniyor?: Promise<void>;
  }
}

export function googleMapsYukle(apiKey: string, kutuphaneler = "") {
  if (window.google?.maps) return Promise.resolve();
  if (window.__googleMapsYukleniyor) return window.__googleMapsYukleniyor;

  window.__googleMapsYukleniyor = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${kutuphaneler ? `&libraries=${kutuphaneler}` : ""}&language=tr&region=TR`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps yüklenemedi"));
    document.head.appendChild(script);
  });

  return window.__googleMapsYukleniyor;
}
