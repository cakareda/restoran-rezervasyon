"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEPOLAMA_ANAHTARI = "masadaki-cerez-bildirimi-gorundu";

export default function CerezBanner() {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    try {
      // localStorage yalnızca client'ta var; SSR/hydration uyumsuzluğuna girmemek
      // için ilk render'da gizli başlayıp mount sonrası tek seferlik kontrol ediyoruz.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(DEPOLAMA_ANAHTARI)) setGorunur(true);
    } catch {
      // localStorage erişilemezse (gizli sekme vb.) banner'ı hiç göstermiyoruz,
      // engelleyici bir davranışa gerek yok — çerez zorunlu/essential zaten.
    }
  }, []);

  function kapat() {
    setGorunur(false);
    try {
      localStorage.setItem(DEPOLAMA_ANAHTARI, "1");
    } catch {
      // yoksay
    }
  }

  if (!gorunur) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-foreground/80">
          Bu site, oturum açmanız için gerekli temel çerezleri kullanır. Detaylar için{" "}
          <Link href="/cerez-politikasi" className="font-semibold text-brand hover:underline">
            Çerez Politikası
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={kapat}
          className="shrink-0 rounded-xl bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
