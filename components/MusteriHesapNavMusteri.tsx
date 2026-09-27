"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MusteriHesapNavMusteri() {
  const t = useTranslations("SiteNav");
  const supabase = createClient();
  const router = useRouter();
  const [adSoyad, setAdSoyad] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptalEdildi = false;

    async function yukle() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!iptalEdildi) {
          setAdSoyad(null);
          setYukleniyor(false);
        }
        return;
      }

      const { data: kullanici } = await supabase
        .from("kullanicilar")
        .select("ad_soyad")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!iptalEdildi) {
        setAdSoyad(kullanici?.ad_soyad ?? null);
        setYukleniyor(false);
      }
    }

    yukle();
    const { data: dinleyici } = supabase.auth.onAuthStateChange(() => yukle());

    return () => {
      iptalEdildi = true;
      dinleyici.subscription.unsubscribe();
    };
  }, [supabase]);

  async function cikisYap() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (yukleniyor) return <div className="h-9 w-24" />;

  if (adSoyad) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/hesap/profil" className="font-medium text-foreground hover:text-brand-dark">
          {t("merhaba")} {adSoyad.split(" ")[0]}
        </Link>
        <button onClick={cikisYap} className="font-medium text-muted hover:text-brand-dark">
          {t("cikisYap")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/hesap/giris"
      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
    >
      {t("girisKayitOl")}
    </Link>
  );
}
