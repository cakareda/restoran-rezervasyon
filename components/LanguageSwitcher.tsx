"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { DILLER, DIL_ADLARI } from "@/i18n/routing";
import { AsagiOkIkonu } from "@/components/icons";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function degistir(e: React.ChangeEvent<HTMLSelectElement>) {
    const yeniDil = e.target.value as (typeof DILLER)[number];
    startTransition(() => {
      router.replace(pathname, { locale: yeniDil });
    });
  }

  return (
    <div className="relative flex items-center">
      <select
        value={locale}
        onChange={degistir}
        aria-label="Dil seçimi / Language"
        className="appearance-none rounded-full border border-border bg-transparent py-2 pl-3 pr-7 text-sm font-medium text-muted hover:text-brand-dark focus:outline-none"
      >
        {DILLER.map((dil) => (
          <option key={dil} value={dil}>
            {DIL_ADLARI[dil]}
          </option>
        ))}
      </select>
      <AsagiOkIkonu className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted" />
    </div>
  );
}
