"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FotoYukleyici({
  restoranId,
  baslangicUrlleri,
  onDegis,
}: {
  restoranId: string | null;
  baslangicUrlleri: string[];
  onDegis: (urller: string[]) => void;
}) {
  const supabase = createClient();
  const [urller, setUrller] = useState<string[]>(baslangicUrlleri);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function guncelle(yeniUrller: string[]) {
    setUrller(yeniUrller);
    onDegis(yeniUrller);
  }

  async function dosyalariYukle(dosyalar: FileList | File[]) {
    if (!restoranId) return;
    setHata(null);
    setYukleniyor(true);

    const yeniUrller: string[] = [];
    for (const dosya of Array.from(dosyalar)) {
      if (!dosya.type.startsWith("image/")) continue;
      const uzanti = dosya.name.split(".").pop() || "jpg";
      const dosyaAdi = `${restoranId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${uzanti}`;

      const { error } = await supabase.storage
        .from("restoran-fotograflari")
        .upload(dosyaAdi, dosya, { cacheControl: "3600", upsert: false });

      if (error) {
        setHata("Bir veya birden fazla fotoğraf yüklenemedi.");
        continue;
      }

      const { data } = supabase.storage.from("restoran-fotograflari").getPublicUrl(dosyaAdi);
      yeniUrller.push(data.publicUrl);
    }

    setYukleniyor(false);
    if (yeniUrller.length > 0) guncelle([...urller, ...yeniUrller]);
  }

  function kaldir(url: string) {
    guncelle(urller.filter((u) => u !== url));
  }

  if (!restoranId) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-zinc-50 p-4 text-sm text-muted">
        Fotoğraf ekleyebilmek için önce aşağıdaki bilgileri bir kere kaydetmen gerekiyor.
      </p>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurukleniyor(true);
        }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurukleniyor(false);
          if (e.dataTransfer.files.length > 0) dosyalariYukle(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
          surukleniyor ? "border-brand bg-brand-light" : "border-border text-muted hover:border-brand/50"
        }`}
      >
        {yukleniyor ? "Yükleniyor..." : "Fotoğrafları sürükle-bırak ya da tıklayıp seç"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) dosyalariYukle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {hata && <p className="mt-2 text-sm font-medium text-red-600">{hata}</p>}

      {urller.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {urller.map((url) => (
            <div key={url} className="group relative h-20 w-20">
              <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => kaldir(url)}
                aria-label="Fotoğrafı kaldır"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 shadow ring-1 ring-border hover:bg-red-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
