import type { ComponentType, ReactNode } from "react";
import PlainLink from "next/link";
import { SITE_ADI } from "@/lib/config";

type LinkTipi = ComponentType<{
  href: string;
  className?: string;
  children?: ReactNode;
}>;

export default function SiteFooter({
  LinkBileseni,
  slogan,
  restoranlarHref,
  restoranlarMetni,
  nasilCalisirHref,
  nasilCalisirMetni,
  baslikMasadaki,
  baslikRestoranlarIcin,
  nedenMasadakiMetni,
  restoranGirisiMetni,
  restoranKayitMetni,
  bizeUlasinMetni,
}: {
  LinkBileseni: LinkTipi;
  slogan: string;
  restoranlarHref: string;
  restoranlarMetni: string;
  nasilCalisirHref: string;
  nasilCalisirMetni: string;
  baslikMasadaki: string;
  baslikRestoranlarIcin: string;
  nedenMasadakiMetni: string;
  restoranGirisiMetni: string;
  restoranKayitMetni: string;
  bizeUlasinMetni: string;
}) {
  const Link = LinkBileseni;

  return (
    <footer className="bg-brand-darkest text-white/70">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-4">
        <div className="sm:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-full-krem.svg"
            alt={SITE_ADI}
            className="h-12 w-auto sm:h-14"
          />
          <p className="mt-3 max-w-xs text-sm font-normal tracking-wide">{slogan}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">{baslikMasadaki}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={restoranlarHref} className="hover:text-white">
                {restoranlarMetni}
              </Link>
            </li>
            <li>
              <Link href={nasilCalisirHref} className="hover:text-white">
                {nasilCalisirMetni}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            {baslikRestoranlarIcin}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <PlainLink href="/restoranlar-icin" className="hover:text-white">
                {nedenMasadakiMetni}
              </PlainLink>
            </li>
            <li>
              <PlainLink href="/restoran-girisi" className="hover:text-white">
                {restoranGirisiMetni}
              </PlainLink>
            </li>
            <li>
              <PlainLink href="/restoran-kayit" className="hover:text-white">
                {restoranKayitMetni}
              </PlainLink>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        <p>
          {bizeUlasinMetni}{" "}
          <a href="mailto:info@masadaki.com" className="font-semibold text-white/70 hover:text-white">
            info@masadaki.com
          </a>
        </p>
        <p className="mt-2 flex items-center justify-center gap-3">
          <PlainLink href="/hakkimizda" className="hover:text-white">
            Hakkımızda
          </PlainLink>
          <span aria-hidden>·</span>
          <PlainLink href="/kvkk" className="hover:text-white">
            KVKK Aydınlatma Metni
          </PlainLink>
          <span aria-hidden>·</span>
          <PlainLink href="/cerez-politikasi" className="hover:text-white">
            Çerez Politikası
          </PlainLink>
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} {SITE_ADI}
        </p>
      </div>
    </footer>
  );
}
