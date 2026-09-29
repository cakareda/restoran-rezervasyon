"use client";

export default function AyarlarForm({
  kaydet,
  hatirlatmaAktif,
  enErkenSaat,
  enGecGun,
  maksimumKisi,
}: {
  kaydet: (formData: FormData) => void;
  hatirlatmaAktif: boolean;
  enErkenSaat: number;
  enGecGun: number;
  maksimumKisi: number;
}) {
  return (
    <form
      action={kaydet}
      className="mt-4 max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm"
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

      <button
        type="submit"
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Kaydet
      </button>
    </form>
  );
}
