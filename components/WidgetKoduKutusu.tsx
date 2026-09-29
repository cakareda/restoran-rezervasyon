"use client";

import { useState } from "react";

export default function WidgetKoduKutusu({ restoranId }: { restoranId: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const kod = `<iframe src="https://masadaki.com/widget/${restoranId}" width="100%" height="640" style="border:0;border-radius:16px;max-width:420px;"></iframe>`;

  async function kopyala() {
    await navigator.clipboard.writeText(kod);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  return (
    <div>
      <textarea
        readOnly
        value={kod}
        rows={3}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border-0 bg-zinc-50 px-2.5 py-2 font-mono text-[11px] text-muted outline-none ring-1 ring-border"
      />
      <button
        type="button"
        onClick={kopyala}
        className="mt-2 w-full rounded-lg bg-foreground px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        {kopyalandi ? "Kopyalandı ✓" : "Kodu kopyala"}
      </button>
    </div>
  );
}
