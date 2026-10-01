"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIYAT_ARALIKLARI } from "@/lib/types";

export default function FiyatSeviyesiSecici({
  restoranId,
  mevcutSeviye,
}: {
  restoranId: string;
  mevcutSeviye: number | null;
}) {
  const router = useRouter();
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function degistir(e: React.ChangeEvent<HTMLSelectElement>) {
    setKaydediliyor(true);
    await fetch(`/api/admin/restoran/${restoranId}/fiyat-seviyesi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fiyatSeviyesi: Number(e.target.value) }),
    });
    setKaydediliyor(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={mevcutSeviye ?? ""}
      onChange={degistir}
      disabled={kaydediliyor}
      className="rounded-lg border-0 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand disabled:opacity-50"
    >
      <option value="" disabled>
        Seçilmedi
      </option>
      {FIYAT_ARALIKLARI.map((f) => (
        <option key={f.seviye} value={f.seviye}>
          {f.etiket}
        </option>
      ))}
    </select>
  );
}
