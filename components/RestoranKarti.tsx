import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Restoran } from "@/lib/types";
import { fiyatSeviyesi } from "@/lib/format";
import { restoranYolu } from "@/lib/slug";
import { TabakIkonu } from "@/components/icons";

export default function RestoranKarti({
  restoran,
  ortalamaPuan,
  yorumSayisi,
}: {
  restoran: Restoran;
  ortalamaPuan: number | null;
  yorumSayisi: number;
}) {
  const t = useTranslations("RestoranKarti");
  const seviye = fiyatSeviyesi(restoran.ortalama_fiyat, restoran.fiyat_seviyesi);

  return (
    <Link
      href={restoranYolu(restoran)}
      className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-900/10"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-brand-light">
        {restoran.fotograflar?.[0] ? (
          <img
            src={restoran.fotograflar[0]}
            alt={restoran.ad}
            className="h-full w-full object-cover"
          />
        ) : (
          <TabakIkonu className="h-10 w-10 text-brand/40" />
        )}
        {ortalamaPuan && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-dark shadow-sm">
            ★ {ortalamaPuan}
          </span>
        )}
      </div>
      <div className="p-4">
        {restoran.duyuru && (
          <p className="mb-1.5 line-clamp-1 text-xs font-semibold text-brand">
            🎉 {restoran.duyuru}
          </p>
        )}
        <h3 className="font-bold text-foreground group-hover:text-brand">{restoran.ad}</h3>
        <p className="mt-1 text-sm text-muted">
          {restoran.semt}, {restoran.sehir} · {restoran.mutfak_turu}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          {seviye && (
            <span className="inline-block rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
              {"₺".repeat(seviye)}
              <span className="text-brand-dark/30">{"₺".repeat(4 - seviye)}</span>
            </span>
          )}
          {yorumSayisi > 0 && (
            <span className="text-xs text-muted">{t("yorumSayisi", { sayi: yorumSayisi })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
