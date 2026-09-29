"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MenuYukleyici({
  restoranId,
  mevcutUrl,
  onDegis,
}: {
  restoranId: string | null;
  mevcutUrl: string;
  onDegis: (url: string) => void;
}) {
  const supabase = createClient();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function dosyaYukle(dosya: File) {
    if (!restoranId) return;
    setHata(null);
    setYukleniyor(true);

    const uzanti = dosya.name.split(".").pop() || "pdf";
    const dosyaAdi = `${restoranId}/menu-${Date.now()}.${uzanti}`;

    const { error } = await supabase.storage
      .from("restoran-fotograflari")
      .upload(dosyaAdi, dosya, { cacheControl: "3600", upsert: false });

    setYukleniyor(false);

    if (error) {
      setHata("Menü yüklenemedi.");
      return;
    }

    const { data } = supabase.storage.from("restoran-fotograflari").getPublicUrl(dosyaAdi);
    onDegis(data.publicUrl);
  }

  if (!restoranId) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-zinc-50 p-4 text-sm text-muted">
        Menü yükleyebilmek için önce aşağıdaki bilgileri bir kere kaydetmen gerekiyor.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={yukleniyor}
        className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
      >
        {yukleniyor ? "Yükleniyor..." : "PDF Yükle"}
      </button>
      {mevcutUrl && (
        <a
          href={mevcutUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Yüklenen menüyü gör
        </a>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) dosyaYukle(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}
    </div>
  );
}
