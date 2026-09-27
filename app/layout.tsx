import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import MusteriHesapNav from "@/components/MusteriHesapNav";
import MobilMenu from "@/components/MobilMenu";
import { SITE_ADI, SITE_SLOGAN } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com"),
  title: {
    template: `%s — ${SITE_ADI}`,
    default: `${SITE_ADI} — Restoran Rezervasyonu`,
  },
  description: SITE_SLOGAN,
  openGraph: {
    siteName: SITE_ADI,
    type: "website",
    locale: "tr_TR",
    title: `${SITE_ADI} — Restoran Rezervasyonu`,
    description: SITE_SLOGAN,
  },
  other: { "color-scheme": "light" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-4 px-4 py-3">
            <div className="flex flex-nowrap items-center gap-6">
              <Link href="/" className="flex shrink-0 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-full.svg" alt={SITE_ADI} className="h-12 w-auto sm:h-14" />
              </Link>
              <nav className="hidden flex-nowrap items-center gap-4 whitespace-nowrap text-sm font-medium text-foreground/80 lg:flex">
                <Link href="/restoranlar" className="hover:text-brand-dark">
                  Restoranlar
                </Link>
                <Link href="/#nasil-calisir" className="hover:text-brand-dark">
                  Nasıl çalışır?
                </Link>
              </nav>
            </div>
            <div className="hidden flex-nowrap items-center gap-3 whitespace-nowrap lg:flex">
              <Link
                href="/restoranlar-icin"
                className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-brand-dark"
              >
                Restoran sahibiyim
              </Link>
              <MusteriHesapNav />
            </div>
            <MobilMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="bg-brand-darkest text-white/70">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-4">
            <div className="sm:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-full-krem.svg"
                alt={SITE_ADI}
                className="h-12 w-auto sm:h-14"
              />
              <p className="mt-3 max-w-xs text-sm">{SITE_SLOGAN}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/50">
                {SITE_ADI}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/restoranlar" className="hover:text-white">
                    Restoranlar
                  </Link>
                </li>
                <li>
                  <Link href="/#nasil-calisir" className="hover:text-white">
                    Nasıl çalışır?
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/50">
                Restoranlar için
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/restoranlar-icin" className="hover:text-white">
                    Neden {SITE_ADI}?
                  </Link>
                </li>
                <li>
                  <Link href="/restoran-girisi" className="hover:text-white">
                    Restoran girişi
                  </Link>
                </li>
                <li>
                  <Link href="/restoran-kayit" className="hover:text-white">
                    Restoranımı ücretsiz kayıt et
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
            <p>
              Bize ulaşın:{" "}
              <a href="mailto:info@masadaki.com" className="font-semibold text-white/70 hover:text-white">
                info@masadaki.com
              </a>
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} {SITE_ADI}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
