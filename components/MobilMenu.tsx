"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIkonu, KapatIkonu } from "@/components/icons";

export default function MobilMenu() {
  const [acik, setAcik] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setAcik(true)}
        aria-label="Menüyü aç"
        className="flex h-9 w-9 items-center justify-center text-foreground"
      >
        <MenuIkonu className="h-6 w-6" />
      </button>

      {acik && (
        <>
          <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setAcik(false)} />
          <div className="fixed top-0 right-0 z-30 flex h-screen w-72 max-w-[80%] flex-col overflow-y-auto bg-background p-6 shadow-xl">
            <button
              onClick={() => setAcik(false)}
              aria-label="Menüyü kapat"
              className="ml-auto flex h-9 w-9 items-center justify-center text-foreground"
            >
              <KapatIkonu className="h-6 w-6" />
            </button>

            <nav className="mt-4 flex flex-col gap-1 text-base font-medium text-foreground">
              <Link
                href="/restoranlar"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                Restoranlar
              </Link>
              <Link
                href="/#nasil-calisir"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                Nasıl çalışır?
              </Link>
              <Link
                href="/#restoranlar-icin"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                Restoranlar için
              </Link>
              <div className="my-2 border-t border-border" />
              <Link
                href="/hesap/giris"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                Giriş Yap / Kayıt Ol
              </Link>
              <Link
                href="/restoran-girisi"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                Restoran girişi
              </Link>
              <Link
                href="/restoran-kayit"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 font-semibold text-brand hover:bg-brand-light"
              >
                Restoranımı Ekle
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
