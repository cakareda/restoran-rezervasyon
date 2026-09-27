import type { ComponentType, ReactNode } from "react";
import PlainLink from "next/link";
import { SITE_ADI } from "@/lib/config";

type LinkTipi = ComponentType<{
  href: string;
  className?: string;
  children?: ReactNode;
}>;

export default function SiteHeader({
  LinkBileseni,
  anaSayfaHref,
  restoranlarHref,
  restoranlarMetni,
  nasilCalisirHref,
  nasilCalisirMetni,
  isletmeSahibiyimMetni,
  sloganMetni,
  dilSecici,
  musteriNav,
  mobilMenu,
}: {
  LinkBileseni: LinkTipi;
  anaSayfaHref: string;
  restoranlarHref: string;
  restoranlarMetni: string;
  nasilCalisirHref: string;
  nasilCalisirMetni: string;
  isletmeSahibiyimMetni: string;
  sloganMetni?: string;
  dilSecici?: ReactNode;
  musteriNav: ReactNode;
  mobilMenu: ReactNode;
}) {
  const Link = LinkBileseni;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex flex-nowrap items-center gap-6">
          <Link href={anaSayfaHref} className="flex shrink-0 flex-col items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.svg" alt={SITE_ADI} className="h-11 w-auto sm:h-12" />
            {sloganMetni && (
              <span className="ml-14 mt-1 hidden text-[11px] font-medium text-muted sm:block">
                {sloganMetni}
              </span>
            )}
          </Link>
          <nav className="hidden flex-nowrap items-center gap-4 whitespace-nowrap text-sm font-medium text-foreground/80 lg:flex">
            <Link href={restoranlarHref} className="hover:text-brand-dark">
              {restoranlarMetni}
            </Link>
            <Link href={nasilCalisirHref} className="hover:text-brand-dark">
              {nasilCalisirMetni}
            </Link>
          </nav>
        </div>
        <div className="hidden flex-nowrap items-center gap-3 whitespace-nowrap lg:flex">
          {dilSecici}
          <PlainLink
            href="/restoranlar-icin"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-brand-dark"
          >
            {isletmeSahibiyimMetni}
          </PlainLink>
          {musteriNav}
        </div>
        {mobilMenu}
      </div>
    </header>
  );
}
