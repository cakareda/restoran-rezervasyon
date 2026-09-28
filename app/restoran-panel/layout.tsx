import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CikisYapButonu from "./CikisYapButonu";
import {
  TakvimIkonu,
  RestoranIkonu,
  MasaIkonu,
  AyarlarIkonu,
  BildirimIkonu,
} from "@/components/icons";

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
    .select("ad, semt")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f4]">
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
          <BildirimIkonu className="h-5 w-5 text-muted" />
          <CikisYapButonu />
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-border bg-white p-3 sm:block">
          <PanelLink href="/restoran-panel" ikon={<TakvimIkonu className="h-4 w-4" />}>
            Rezervasyonlar
          </PanelLink>
          <PanelLink
            href="/restoran-panel/restoranim"
            ikon={<RestoranIkonu className="h-4 w-4" />}
          >
            Restoranım
          </PanelLink>
          <div className="mt-1 flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted/50">
            <MasaIkonu className="h-4 w-4" /> Masalar
            <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
              Yakında
            </span>
          </div>
          <div className="mt-1 flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted/50">
            <AyarlarIkonu className="h-4 w-4" /> Ayarlar
            <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
              Yakında
            </span>
          </div>
        </nav>

        <main className="flex-1 px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
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
