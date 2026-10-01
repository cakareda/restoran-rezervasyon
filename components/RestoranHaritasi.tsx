"use client";

import { useEffect, useRef, useState } from "react";
import { googleMapsYukle } from "@/lib/googleMaps";

type HaritaRestoran = { id: string; ad: string; lat: number; lng: number; href: string };

export default function RestoranHaritasi({ restoranlar }: { restoranlar: HaritaRestoran[] }) {
  const haritaRef = useRef<HTMLDivElement>(null);
  const [hata, setHata] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !haritaRef.current || restoranlar.length === 0) return;

    googleMapsYukle(apiKey)
      .then(() => {
        if (!haritaRef.current || !window.google) return;
        const map = new window.google.maps.Map(haritaRef.current, {
          center: { lat: restoranlar[0].lat, lng: restoranlar[0].lng },
          zoom: 12,
        });

        const bounds = new window.google.maps.LatLngBounds();
        for (const r of restoranlar) {
          const konum = { lat: r.lat, lng: r.lng };
          const marker = new window.google!.maps.Marker({ position: konum, map, title: r.ad });
          const infoWindow = new window.google!.maps.InfoWindow({
            content: `<a href="${r.href}" style="font-weight:600;color:#7a1f2b;">${r.ad}</a>`,
          });
          window.google!.maps.event.addListener(marker, "click", () => infoWindow.open(map, marker));
          bounds.extend(konum);
        }
      })
      .catch(() => setHata(true));
  }, [apiKey, restoranlar]);

  if (!apiKey || hata) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
        Harita şu anda yüklenemiyor, listeden devam edebilirsin.
      </p>
    );
  }

  if (restoranlar.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
        Konum bilgisi olan restoran yok.
      </p>
    );
  }

  return <div ref={haritaRef} className="h-[480px] w-full rounded-2xl border border-border" />;
}
