import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { OnayIkonu } from "@/components/icons";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RezervasyonBasarili() {
  const t = useTranslations("RezervasyonBasarili");

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-orange-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <OnayIkonu className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-foreground">{t("baslik")}</h1>
        <p className="mt-3 text-muted">{t("aciklama")}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("anaSayfayaDon")}
        </Link>
      </div>
    </div>
  );
}
