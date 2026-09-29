"use client";

export default function AyarlarForm({
  kaydet,
  hatirlatmaAktif,
}: {
  kaydet: (formData: FormData) => void;
  hatirlatmaAktif: boolean;
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

      <button
        type="submit"
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Kaydet
      </button>
    </form>
  );
}
