import Link from "next/link";
import type { Metadata } from "next";
import { SITE_ADI } from "@/lib/config";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

export default function BulunamadiSayfasi() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-6 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="h-14 w-14" />
      <p className="mt-5 text-sm font-bold uppercase tracking-wide text-brand">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-foreground">Bu sayfa bulunamadı</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ana sayfaya dönebilirsin.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        {SITE_ADI} ana sayfasına dön
      </Link>
    </div>
  );
}
