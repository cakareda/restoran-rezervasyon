import type { Metadata } from "next";
import "./globals.css";
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
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
