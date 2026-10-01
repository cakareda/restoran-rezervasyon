import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CikisYapButonu from "./CikisYapButonu";
import BildirimZili from "./BildirimZili";
import PwaKaydi from "./PwaKaydi";
import {
  TakvimIkonu,
  RestoranIkonu,
  MasaIkonu,
  AyarlarIkonu,
  RaporIkonu,
} from "@/components/icons";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Masadaki Panel" },
};

export const viewport: Viewport = {
  themeColor: "#faf7f4",
};

export default async function RestoranPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/restoran-girisi");

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("id, ad, semt")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f4]">
      <PwaKaydi />
      <header className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <Link href="/restoran-panel" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span>
            <span className="block text-base font-extrabold leading-tight text-foreground">
              Masadaki
            </span>
            <span className="block text-[11px] leading-tight text-muted">Restoran Paneli</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {restoran && (
            <span className="hidden rounded-full bg-brand-light px-3.5 py-1.5 text-sm font-semibold text-brand-dark sm:inline-flex sm:items-center sm:gap-1.5">
              <RestoranIkonu className="h-4 w-4" />
              {restoran.ad}
              {restoran.semt && <span className="font-normal text-brand-dark/70">· {restoran.semt}</span>}
            </span>
          )}
          {restoran && <BildirimZili restoranId={restoran.id} />}
          <CikisYapButonu />
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-border bg-white p-3 sm:block">
          <PanelLink href="/restoran-panel" ikon={<TakvimIkonu className="h-4 w-4" />}>
            Rezervasyonlar
          </PanelLink>
          <PanelLink
            href="/restoran-panel/bekleme-listesi"
            ikon={<MasaIkonu className="h-4 w-4" />}
          >
            Bekleme Listesi
          </PanelLink>
          <PanelLink
            href="/restoran-panel/kat-plani"
            ikon={<MasaIkonu className="h-4 w-4" />}
          >
            Kat Planı
          </PanelLink>
          <PanelLink
            href="/restoran-panel/restoranim"
            ikon={<RestoranIkonu className="h-4 w-4" />}
          >
            Restoranım
          </PanelLink>
          <PanelLink href="/restoran-panel/raporlar" ikon={<RaporIkonu className="h-4 w-4" />}>
            Raporlar
          </PanelLink>
          <PanelLink href="/restoran-panel/ayarlar" ikon={<AyarlarIkonu className="h-4 w-4" />}>
            Ayarlar
          </PanelLink>
        </nav>

        <main className="flex-1 px-5 py-6 pb-24 sm:px-8 sm:pb-6">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-white sm:hidden">
        <MobilPanelLink href="/restoran-panel" ikon={<TakvimIkonu className="h-5 w-5" />}>
          Rezervasyon
        </MobilPanelLink>
        <MobilPanelLink href="/restoran-panel/bekleme-listesi" ikon={<MasaIkonu className="h-5 w-5" />}>
          Bekleme
        </MobilPanelLink>
        <MobilPanelLink href="/restoran-panel/kat-plani" ikon={<MasaIkonu className="h-5 w-5" />}>
          Kat Planı
        </MobilPanelLink>
        <MobilPanelLink href="/restoran-panel/restoranim" ikon={<RestoranIkonu className="h-5 w-5" />}>
          Restoranım
        </MobilPanelLink>
        <MobilPanelLink href="/restoran-panel/raporlar" ikon={<RaporIkonu className="h-5 w-5" />}>
          Rapor
        </MobilPanelLink>
        <MobilPanelLink href="/restoran-panel/ayarlar" ikon={<AyarlarIkonu className="h-5 w-5" />}>
          Ayarlar
        </MobilPanelLink>
      </nav>
    </div>
  );
}

function MobilPanelLink({
  href,
  ikon,
  children,
}: {
  href: string;
  ikon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-muted hover:text-brand-dark"
    >
      {ikon}
      {children}
    </Link>
  );
}

function PanelLink({
  href,
  ikon,
  children,
}: {
  href: string;
  ikon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-brand-light hover:text-brand-dark"
    >
      {ikon}
      {children}
    </Link>
  );
}
