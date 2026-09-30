"use client";

import { useEffect, useState } from "react";

export default function AyarlarForm({
  kaydet,
  hatirlatmaAktif,
  enErkenSaat,
  enGecGun,
  maksimumKisi,
  grupEsigi,
}: {
  kaydet: (formData: FormData) => void;
  hatirlatmaAktif: boolean;
  enErkenSaat: number;
  enGecGun: number;
  maksimumKisi: number;
  grupEsigi: number | null;
}) {
  const [degisti, setDegisti] = useState(false);

  useEffect(() => {
    function ayrilmaUyarisi(e: BeforeUnloadEvent) {
      if (!degisti) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", ayrilmaUyarisi);
    return () => window.removeEventListener("beforeunload", ayrilmaUyarisi);
  }, [degisti]);

  return (
    <form
      action={kaydet}
      onChange={() => setDegisti(true)}
      className="mt-4 max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 pb-20 shadow-sm"
    >
      <p className="text-sm font-semibold text-foreground">Bildirimler</p>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-brand-light px-4 py-3">
        <span className="text-sm text-foreground">
          Misafirlere otomatik hatırlatma e-postası gönderilsin
          <span className="block text-xs text-muted">
            Rezervasyondan ~3 saat önce Masadaki üzerinden gönderilir.
          </span>
        </span>
        <input
          type="checkbox"
          name="hatirlatmaEpostasi"
          defaultChecked={hatirlatmaAktif}
          className="h-5 w-5 accent-brand"
        />
      </label>

      <p className="border-t border-border pt-4 text-sm font-semibold text-foreground">
        Rezervasyon kuralları
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="enErkenSaat" className="mb-1 block text-xs font-semibold text-muted">
            En erken (kaç saat öncesinden)
          </label>
          <input
            id="enErkenSaat"
            type="number"
            name="enErkenSaat"
            min={0}
            max={168}
            defaultValue={enErkenSaat}
            className="w-full rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
        <div>
          <label htmlFor="enGecGun" className="mb-1 block text-xs font-semibold text-muted">
            En geç (kaç gün ileriye)
          </label>
          <input
            id="enGecGun"
            type="number"
            name="enGecGun"
            min={1}
            max={365}
            defaultValue={enGecGun}
            className="w-full rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
          />
        </div>
      </div>

      <div>
        <label htmlFor="maksimumKisi" className="mb-1 block text-xs font-semibold text-muted">
          Online rezervasyonda maksimum kişi sayısı
        </label>
        <input
          id="maksimumKisi"
          type="number"
          name="maksimumKisi"
          min={1}
          max={100}
          defaultValue={maksimumKisi}
          className="w-32 rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
        />
        <p className="mt-1 text-xs text-muted">
          Bunun üzerindeki gruplar için misafire telefonla arama önerilir.
        </p>
      </div>

      <div>
        <label htmlFor="grupEsigi" className="mb-1 block text-xs font-semibold text-muted">
          Grup rezervasyonu eşiği (opsiyonel)
        </label>
        <input
          id="grupEsigi"
          type="number"
          name="grupEsigi"
          min={2}
          max={100}
          defaultValue={grupEsigi ?? ""}
          placeholder="örn. 8"
          className="w-32 rounded-lg border-0 px-2.5 py-1.5 text-sm ring-1 ring-border"
        />
        <p className="mt-1 text-xs text-muted">
          Bu kişi sayısı ve üzeri rezervasyonlarda rezervasyon listesinde &quot;Grup&quot;
          rozeti gösterilir.
        </p>
      </div>

      <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-white/95 px-6 py-3 backdrop-blur">
        <p className="text-xs text-muted">
          {degisti ? "Kaydedilmemiş değişikliklerin var." : "Her şey kaydedildi."}
        </p>
        <button
          type="submit"
          onClick={() => setDegisti(false)}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
}
